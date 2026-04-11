use anyhow::Result;
use tracing::info;

use crate::webhooks::samsara::{extract_driver, extract_vehicle, SamsaraWebhook};
use crate::AppState;

pub async fn handle_route_event(state: &AppState, webhook: &SamsaraWebhook) -> Result<()> {
    let vehicle = match extract_vehicle(webhook) {
        Some(v) => v,
        None => return Ok(()),
    };

    let summary = webhook
        .event
        .get("details")
        .and_then(|d| d.as_str())
        .unwrap_or("Sin detalles disponibles");

    let alert_condition = webhook
        .event
        .get("alertConditionId")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    // Construir contexto para la IA
    let contexto = match alert_condition {
        "RouteStopEarlyLateArrival" => format!(
            "El camión '{}' llegó tarde o temprano a una parada de ruta. Detalle: {}",
            vehicle.name, summary
        ),
        "RouteStopEtaUpdated" => format!(
            "El ETA del camión '{}' fue actualizado. Detalle: {}",
            vehicle.name, summary
        ),
        "RouteStopArrival" => format!(
            "El camión '{}' llegó a su destino. Detalle: {}",
            vehicle.name, summary
        ),
        _ => format!("Evento de ruta del camión '{}': {}", vehicle.name, summary),
    };

    info!("Trip monitor: {}", contexto);

    let mensaje = state.ai.redactar_alerta(&contexto).await?;

    let truck_id = Some(vehicle.id.as_str());
    let driver_pair = extract_driver(webhook);
    let driver_id_for_db = driver_pair.as_ref().map(|d| d.0.as_str());

    if let Some((driver_id_str, _driver_name)) = &driver_pair {
        if let Ok(Some(driver)) = state.db.get_driver(driver_id_str).await {
            state
                .whatsapp
                .send_text(&driver.phone, &mensaje)
                .await?;
            state
                .memory
                .log_alert("route_event", &driver.phone, &mensaje)
                .await?;
            state
                .db
                .insert_alert(
                    "route_event",
                    &driver.phone,
                    &mensaje,
                    truck_id,
                    Some(driver_id_str.as_str()),
                )
                .await?;
        }
    }

    state
        .whatsapp
        .send_text(&state.config.monitor_phone, &mensaje)
        .await?;
    state
        .db
        .insert_alert(
            "route_event",
            &state.config.monitor_phone,
            &mensaje,
            truck_id,
            driver_id_for_db,
        )
        .await?;

    Ok(())
}

pub async fn handle_vehicle_stopped(state: &AppState, webhook: &SamsaraWebhook) -> Result<()> {
    let vehicle = match extract_vehicle(webhook) {
        Some(v) => v,
        None => return Ok(()),
    };

    let summary = webhook
        .event
        .get("summary")
        .and_then(|s| s.as_str())
        .unwrap_or("El vehículo se detuvo");

    let contexto = format!(
        "El camión '{}' se detuvo y lleva tiempo parado. Resumen: {}. \
        Notifica al monitorista con urgencia.",
        vehicle.name, summary
    );

    let mensaje = state.ai.redactar_alerta(&contexto).await?;
    let driver_id = extract_driver(webhook).as_ref().map(|d| d.0.as_str());

    state
        .whatsapp
        .send_text(&state.config.monitor_phone, &mensaje)
        .await?;
    state
        .db
        .insert_alert(
            "vehicle_stopped",
            &state.config.monitor_phone,
            &mensaje,
            Some(vehicle.id.as_str()),
            driver_id,
        )
        .await?;

    Ok(())
}

pub async fn handle_geofence(state: &AppState, webhook: &SamsaraWebhook) -> Result<()> {
    let vehicle = match extract_vehicle(webhook) {
        Some(v) => v,
        None => return Ok(()),
    };

    let summary = webhook
        .event
        .get("summary")
        .and_then(|s| s.as_str())
        .unwrap_or("Evento de geocerca");

    let contexto = format!(
        "Evento de geocerca para el camión '{}': {}",
        vehicle.name, summary
    );

    let mensaje = state.ai.redactar_alerta(&contexto).await?;
    let driver_id = extract_driver(webhook).as_ref().map(|d| d.0.as_str());

    state
        .whatsapp
        .send_text(&state.config.monitor_phone, &mensaje)
        .await?;
    state
        .db
        .insert_alert(
            "geofence",
            &state.config.monitor_phone,
            &mensaje,
            Some(vehicle.id.as_str()),
            driver_id,
        )
        .await?;

    Ok(())
}
