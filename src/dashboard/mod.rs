use axum::{
    extract::State,
    http::StatusCode,
    response::{Html, IntoResponse},
};
use chrono::Utc;
use serde::Serialize;
use tera::{Context, Tera};

use crate::memory::sqlite_store::{AbsentDriver, AlertRow, TruckRow};
use crate::AppState;

#[derive(Serialize)]
struct TruckView {
    name: String,
    id: String,
    status_label: String,
    status_class: String,
}

#[derive(Serialize)]
struct AbsentView {
    id: String,
    name: String,
    days: i64,
}

#[derive(Serialize)]
struct AlertView {
    sent_at: String,
    alert_type: String,
    recipient_phone: String,
    message: String,
}

fn truck_to_view(t: &TruckRow) -> TruckView {
    let now = Utc::now().naive_utc();
    let mut status_label = match t.status.as_str() {
        "detenido" => "Detenido",
        "activo" => "En ruta",
        "unknown" => "Sin señal",
        _ => "Sin señal",
    };
    let mut status_class = match t.status.as_str() {
        "detenido" => "status-stopped",
        "activo" => "status-moving",
        _ => "status-unknown",
    };

    if let Some(seen) = t.last_seen_at {
        if (now - seen).num_hours() > 2 && t.status != "detenido" {
            status_label = "Sin señal";
            status_class = "status-unknown";
        }
    } else if t.status == "unknown" {
        status_label = "Sin señal";
        status_class = "status-unknown";
    }

    TruckView {
        name: t.name.clone(),
        id: t.id.clone(),
        status_label: status_label.to_string(),
        status_class: status_class.to_string(),
    }
}

fn absent_to_view(d: &AbsentDriver) -> AbsentView {
    AbsentView {
        id: d.id.clone(),
        name: d.name.clone(),
        days: d.days_absent,
    }
}

fn alert_to_view(a: &AlertRow) -> AlertView {
    AlertView {
        sent_at: a.sent_at.format("%Y-%m-%d %H:%M").to_string(),
        alert_type: a.alert_type.clone(),
        recipient_phone: a.recipient_phone.clone(),
        message: a.message.clone(),
    }
}

pub async fn index(State(state): State<AppState>) -> impl IntoResponse {
    match render(&state).await {
        Ok(html) => Html(html).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Error dashboard: {}", e),
        )
            .into_response(),
    }
}

async fn render(state: &AppState) -> anyhow::Result<String> {
    let trucks_db = state.db.list_trucks().await.unwrap_or_default();
    let trucks: Vec<TruckView> = trucks_db.iter().map(truck_to_view).collect();

    let absent = state
        .db
        .get_absent_drivers(state.config.absence_threshold_days)
        .await
        .unwrap_or_default();
    let absent_views: Vec<AbsentView> = absent.iter().map(absent_to_view).collect();

    let alerts_db = state.db.list_recent_alerts(20).await.unwrap_or_default();
    let alerts: Vec<AlertView> = alerts_db.iter().map(alert_to_view).collect();

    let last = state.last_webhook_at.read().await;
    let last_webhook = last
        .as_ref()
        .map(|t| t.format("%Y-%m-%d %H:%M:%S UTC").to_string())
        .unwrap_or_else(|| "Sin webhooks aún".to_string());

    let mut tera = Tera::default();
    tera.add_raw_template(
        "dashboard.html",
        include_str!("../../templates/dashboard.html"),
    )?;

    let mut ctx = Context::new();
    ctx.insert("trucks", &trucks);
    ctx.insert("absent", &absent_views);
    ctx.insert("alerts", &alerts);
    ctx.insert("last_webhook", &last_webhook);

    Ok(tera.render("dashboard.html", &ctx)?)
}
