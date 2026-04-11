use axum::{
    body::Bytes,
    extract::State,
    http::{HeaderMap, StatusCode},
};
use chrono::Utc;
use tracing::{error, info, warn};

use crate::agents::{absence_detector, trip_monitor};
use crate::AppState;

pub mod samsara;
pub mod signature;

pub async fn handle_samsara_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> StatusCode {
    // 1. Verificar firma HMAC inmediatamente — responder 200 de todas formas
    //    (Samsara reintenta si recibe no-2xx, mejor loggear y aceptar)
    let timestamp = headers
        .get("x-samsara-timestamp")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let sig = headers
        .get("x-samsara-signature")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !timestamp.is_empty() && !sig.is_empty() {
        if let Err(e) = signature::verify_samsara_signature(
            &state.config.samsara_webhook_secret,
            timestamp,
            &body,
            sig,
        ) {
            warn!("Firma inválida de Samsara: {}", e);
            // Aún retornamos 200 para que Samsara no reintente indefinidamente
            // pero no procesamos el evento
            return StatusCode::OK;
        }
    }

    // 2. Parsear el payload
    let webhook: samsara::SamsaraWebhook = match serde_json::from_slice(&body) {
        Ok(w) => w,
        Err(e) => {
            error!("Error parseando webhook: {}", e);
            return StatusCode::OK;
        }
    };

    info!("Webhook recibido: {} - {}", webhook.event_type, webhook.event_id);

    {
        let mut last = state.last_webhook_at.write().await;
        *last = Some(Utc::now());
    }

    // 3. Responder 200 PRIMERO, procesar en background
    // Samsara requiere 2xx rápido
    let state_clone = state.clone();
    let webhook_clone = webhook.clone();
    tokio::spawn(async move {
        process_webhook(state_clone, webhook_clone).await;
    });

    StatusCode::OK
}

async fn process_webhook(state: AppState, webhook: samsara::SamsaraWebhook) {
    let payload = serde_json::to_string(&webhook.event).unwrap_or_default();
    let truck_id = samsara::extract_vehicle(&webhook).map(|v| v.id);
    let driver_id = samsara::extract_driver(&webhook).map(|d| d.0);

    if let Err(e) = state
        .db
        .insert_event(
            &webhook.event_id,
            &webhook.event_type,
            truck_id.as_deref(),
            driver_id.as_deref(),
            &payload,
        )
        .await
    {
        error!("Error guardando evento: {}", e);
    }

    if let Some(ref v) = samsara::extract_vehicle(&webhook) {
        let status = "activo";
        let _ = state
            .db
            .upsert_truck(&v.id, &v.name, status, None)
            .await;
    }
    if let Some((ref id, ref name)) = samsara::extract_driver(&webhook) {
        let _ = state
            .db
            .upsert_driver(id, name, "000000000000")
            .await;
    }

    let alert_type = samsara::extract_alert_condition(&webhook);

    match alert_type {
        samsara::SamsaraAlertType::Ping => {
            info!("Ping de Samsara recibido — webhook configurado correctamente ✓");
        }
        samsara::SamsaraAlertType::RouteEtaUpdated
        | samsara::SamsaraAlertType::RouteStopLate
        | samsara::SamsaraAlertType::RouteStopArrival => {
            if let Err(e) = trip_monitor::handle_route_event(&state, &webhook).await {
                error!("Error en trip_monitor: {}", e);
            }
        }
        samsara::SamsaraAlertType::VehicleStopped => {
            if let Some(ref v) = samsara::extract_vehicle(&webhook) {
                let _ = state
                    .db
                    .upsert_truck(&v.id, &v.name, "detenido", None)
                    .await;
            }
            if let Err(e) = trip_monitor::handle_vehicle_stopped(&state, &webhook).await {
                error!("Error en vehicle_stopped: {}", e);
            }
        }
        samsara::SamsaraAlertType::GeofenceEntry | samsara::SamsaraAlertType::GeofenceExit => {
            if let Err(e) = trip_monitor::handle_geofence(&state, &webhook).await {
                error!("Error en geofence: {}", e);
            }
        }
        samsara::SamsaraAlertType::EngineOn => {
            if let Err(e) = absence_detector::handle_engine_on(&state, &webhook).await {
                error!("Error en engine_on: {}", e);
            }
        }
        other => {
            info!("Evento no manejado: {:?}", other);
        }
    }
}
