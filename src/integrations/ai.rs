// Usa OpenAI para redactar mensajes en español mexicano informal
// El tono es directo, como hablaría un despachador de transportes

use anyhow::Result;
use serde_json::json;
use tracing::warn;

pub struct AiClient {
    api_key: String,
    client: reqwest::Client,
}

impl AiClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }

    pub async fn redactar_alerta(&self, contexto: &str) -> Result<String> {
        let fallback = "Alerta de logística: revisa el panel FullTrailer para detalles.".to_string();

        let response = match self
            .client
            .post("https://api.openai.com/v1/chat/completions")
            .bearer_auth(&self.api_key)
            .json(&json!({
                "model": "gpt-4o-mini",
                "max_tokens": 150,
                "messages": [
                    {
                        "role": "system",
                        "content": "Eres el sistema de alertas de una empresa de logística de transporte en México. \
                        Redacta mensajes de WhatsApp cortos, directos y en español mexicano informal. \
                        Máximo 2 oraciones. Sin emojis excesivos. Tono: profesional pero directo, \
                        como hablaría un jefe de operaciones. NUNCA inventes datos que no estén en el contexto."
                    },
                    {
                        "role": "user",
                        "content": contexto
                    }
                ]
            }))
            .send()
            .await
        {
            Ok(r) => r,
            Err(e) => {
                warn!("OpenAI request falló: {}", e);
                return Ok(fallback);
            }
        };

        let parsed: serde_json::Value = match response.json().await {
            Ok(v) => v,
            Err(e) => {
                warn!("OpenAI JSON inválido: {}", e);
                return Ok(fallback);
            }
        };

        let mensaje = parsed["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("Alerta del sistema de logística.")
            .trim()
            .to_string();

        if mensaje.is_empty() {
            return Ok(fallback);
        }

        Ok(mensaje)
    }
}
