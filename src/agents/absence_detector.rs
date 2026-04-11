use anyhow::Result;
use tracing::info;

use crate::webhooks::samsara::{extract_driver, SamsaraWebhook};
use crate::AppState;

// Se llama cuando Samsara detecta EngineOn — el chofer está activo
pub async fn handle_engine_on(state: &AppState, webhook: &SamsaraWebhook) -> Result<()> {
    if let Some((driver_id, driver_name)) = extract_driver(webhook) {
        state.db.update_driver_last_trip(&driver_id).await?;
        state
            .memory
            .update_driver_memory(
                &driver_id,
                &driver_name,
                "activo",
                "Motor encendido — viaje iniciado",
            )
            .await?;
        info!("Chofer {} marcado como activo", driver_name);
    }
    Ok(())
}

// Job diario: detectar choferes ausentes
pub async fn check_all_absences(state: &AppState) -> Result<()> {
    info!("Corriendo check de ausencias...");

    let ausentes = state
        .db
        .get_absent_drivers(state.config.absence_threshold_days)
        .await?;

    for driver in &ausentes {
        let contexto = format!(
            "El chofer '{}' lleva {} días sin presentarse a trabajar ni hacer viajes. \
            Mándale un mensaje pidiéndole que se presente o que avise si tiene algún problema.",
            driver.name, driver.days_absent
        );

        let mensaje_chofer = state.ai.redactar_alerta(&contexto).await?;
        state.whatsapp.send_text(&driver.phone, &mensaje_chofer).await?;

        state
            .db
            .insert_alert(
                "ausencia",
                &driver.phone,
                &mensaje_chofer,
                None,
                Some(driver.id.as_str()),
            )
            .await?;

        // Notificar al monitorista también
        let contexto_monitor = format!(
            "Alerta de ausencia: el chofer '{}' lleva {} días sin hacer viajes.",
            driver.name, driver.days_absent
        );
        let mensaje_monitor = state.ai.redactar_alerta(&contexto_monitor).await?;
        state
            .whatsapp
            .send_text(&state.config.monitor_phone, &mensaje_monitor)
            .await?;

        state
            .db
            .insert_alert(
                "ausencia_monitor",
                &state.config.monitor_phone,
                &mensaje_monitor,
                None,
                Some(driver.id.as_str()),
            )
            .await?;

        state
            .memory
            .update_driver_memory(
                &driver.id,
                &driver.name,
                "ausente",
                &format!("Alerta de ausencia enviada — {} días sin viaje", driver.days_absent),
            )
            .await?;

        state
            .memory
            .log_alert("ausencia", &driver.phone, &mensaje_chofer)
            .await?;
    }

    if ausentes.is_empty() {
        info!("No hay choferes ausentes hoy.");
    } else {
        info!("{} choferes ausentes notificados.", ausentes.len());
    }

    Ok(())
}
