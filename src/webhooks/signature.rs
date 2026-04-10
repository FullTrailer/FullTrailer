// Verificación HMAC-SHA256 de Samsara
// Doc: https://developers.samsara.com/docs/webhooks#webhook-signatures
//
// La firma viene en X-Samsara-Signature como "v1=<hex>"
// Se calcula con HMAC-SHA256(base64decode(secret), "v1:<timestamp>:<body>")

use anyhow::{bail, Result};
use base64::{engine::general_purpose, Engine};
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

pub fn verify_samsara_signature(
    secret_b64: &str,
    timestamp: &str,
    body: &[u8],
    signature_header: &str,
) -> Result<()> {
    // El header tiene formato "v1=<hexdigest>"
    let expected_prefix = "v1=";
    if !signature_header.starts_with(expected_prefix) {
        bail!("Firma inválida: no tiene prefijo v1=");
    }

    // Decodificar la clave secreta de Base64
    let secret = general_purpose::STANDARD.decode(secret_b64)?;

    // Construir el mensaje: "v1:<timestamp>:<body>"
    let mut message = format!("v1:{}:", timestamp).into_bytes();
    message.extend_from_slice(body);

    // Calcular HMAC
    let mut mac = HmacSha256::new_from_slice(&secret)?;
    mac.update(&message);
    let result = mac.finalize().into_bytes();
    let computed = format!("v1={}", hex::encode(result));

    // Comparación segura contra timing attacks
    if computed != signature_header {
        bail!("Firma de Samsara inválida");
    }

    Ok(())
}
