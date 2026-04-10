// WhatsApp Business Cloud API (Meta)
// Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api

use anyhow::Result;
use serde_json::json;
use tracing::info;

pub struct WhatsAppClient {
    token: String,
    phone_number_id: String,
    dry_run: bool,
    client: reqwest::Client,
}

impl WhatsAppClient {
    pub fn new(token: String, phone_number_id: String, dry_run: bool) -> Self {
        Self {
            token,
            phone_number_id,
            dry_run,
            client: reqwest::Client::new(),
        }
    }

    pub async fn send_text(&self, to: &str, message: &str) -> Result<()> {
        if self.dry_run {
            info!(
                "[WhatsApp DRY RUN] a {}: {:.200}{}",
                to,
                message,
                if message.len() > 200 { "..." } else { "" }
            );
            return Ok(());
        }

        // El número 'to' debe ser formato internacional sin + (ej: 5215512345678)
        let url = format!(
            "https://graph.facebook.com/v19.0/{}/messages",
            self.phone_number_id
        );

        let body = json!({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {
                "preview_url": false,
                "body": message
            }
        });

        let res = self
            .client
            .post(&url)
            .bearer_auth(&self.token)
            .json(&body)
            .send()
            .await?;

        if res.status().is_success() {
            info!("WhatsApp enviado a {}: {:.50}...", to, message);
        } else {
            let err = res.text().await?;
            anyhow::bail!("Error WhatsApp API: {}", err);
        }

        Ok(())
    }
}
