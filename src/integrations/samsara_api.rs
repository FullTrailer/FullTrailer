//! Cliente REST de Samsara (ETAs y datos de flota).
//! Ampliar con endpoints concretos cuando se integre lectura de rutas programadas.

use anyhow::Result;
use serde_json::Value;

pub struct SamsaraApiClient {
    token: String,
    client: reqwest::Client,
}

impl SamsaraApiClient {
    pub fn new(token: String) -> Self {
        Self {
            token,
            client: reqwest::Client::new(),
        }
    }

    /// Placeholder: en una fase posterior se consultan ETAs de rutas abiertas.
    pub async fn fetch_route_etas_json(&self) -> Result<Value> {
        let _ = &self.token;
        // Ejemplo de base URL: https://api.samsara.com/fleet/routes
        Ok(serde_json::json!({ "routes": [], "note": "integración pendiente" }))
    }
}
