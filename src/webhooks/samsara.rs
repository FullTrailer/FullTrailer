use serde::{Deserialize, Serialize};

// Payload base de todos los webhooks de Samsara
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SamsaraWebhook {
    #[serde(rename = "eventId")]
    pub event_id: String,
    #[serde(rename = "eventMs")]
    pub event_ms: i64,
    #[serde(rename = "eventType")]
    pub event_type: String,
    pub event: serde_json::Value, // flexible para v1 y v2
    #[serde(rename = "orgId")]
    pub org_id: Option<i64>,
}

// Tipos de alerta v1.0 que nos interesan
#[derive(Debug, Clone, PartialEq)]
pub enum SamsaraAlertType {
    VehicleStopped,
    GeofenceEntry,
    GeofenceExit,
    Speeding,
    DocumentSubmitted,
    RouteEtaUpdated,
    RouteStopArrival,
    RouteStopLate,
    EngineOn,
    EngineOff,
    Ping,
    Unknown(String),
}

impl From<&str> for SamsaraAlertType {
    fn from(s: &str) -> Self {
        match s {
            "Ping" => Self::Ping,
            "VehicleStopped" | "DeviceStoppedMoving" => Self::VehicleStopped,
            "DeviceLocationInsideGeofence" => Self::GeofenceEntry,
            "DeviceLocationOutsideGeofence" => Self::GeofenceExit,
            "DeviceSpeedAboveSpeedLimit" => Self::Speeding,
            "DriverDocumentSubmitted" | "DocumentSubmitted" => Self::DocumentSubmitted,
            "RouteStopEtaUpdated" => Self::RouteEtaUpdated,
            "RouteStopArrival" => Self::RouteStopArrival,
            "RouteStopEarlyLateArrival" => Self::RouteStopLate,
            "EngineOn" => Self::EngineOn,
            "EngineOff" => Self::EngineOff,
            other => Self::Unknown(other.to_string()),
        }
    }
}

// Extrae el alertConditionId del evento (v1.0)
pub fn extract_alert_condition(webhook: &SamsaraWebhook) -> SamsaraAlertType {
    if webhook.event_type == "Ping" {
        return SamsaraAlertType::Ping;
    }
    webhook
        .event
        .get("alertConditionId")
        .and_then(|v| v.as_str())
        .map(SamsaraAlertType::from)
        .unwrap_or(SamsaraAlertType::Unknown("sin_condition".into()))
}

// Info básica del vehículo en el evento
#[derive(Debug, Clone)]
pub struct VehicleInfo {
    pub id: String,
    pub name: String,
    pub serial: Option<String>,
}

pub fn extract_vehicle(webhook: &SamsaraWebhook) -> Option<VehicleInfo> {
    let device = webhook.event.get("device")?;
    Some(VehicleInfo {
        id: device.get("id")?.as_i64()?.to_string(),
        name: device.get("name")?.as_str()?.to_string(),
        serial: device.get("serial").and_then(|s| s.as_str()).map(String::from),
    })
}

pub fn extract_driver(webhook: &SamsaraWebhook) -> Option<(String, String)> {
    let driver = webhook.event.get("driver")?;
    Some((
        driver.get("id")?.as_i64()?.to_string(),
        driver.get("name")?.as_str()?.to_string(),
    ))
}
