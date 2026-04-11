use base64::{engine::general_purpose, Engine};
use fulltrailer::webhooks::signature::verify_samsara_signature;
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

fn firmar(secret_b64: &str, timestamp: &str, body: &[u8]) -> String {
    let secret = general_purpose::STANDARD.decode(secret_b64).unwrap();
    let mut message = format!("v1:{}:", timestamp).into_bytes();
    message.extend_from_slice(body);
    let mut mac = HmacSha256::new_from_slice(&secret).unwrap();
    mac.update(&message);
    let result = mac.finalize().into_bytes();
    format!("v1={}", hex::encode(result))
}

#[test]
fn verifica_firma_samsara_valida() {
    let secret = b"clave-secreta-de-prueba";
    let secret_b64 = general_purpose::STANDARD.encode(secret);
    let ts = "1700000000";
    let body = br#"{"eventId":"1","eventMs":0,"eventType":"Ping","event":{}}"#;
    let sig = firmar(&secret_b64, ts, body);
    verify_samsara_signature(&secret_b64, ts, body, &sig).unwrap();
}

#[test]
fn rechaza_firma_incorrecta() {
    let secret = b"clave-secreta-de-prueba";
    let secret_b64 = general_purpose::STANDARD.encode(secret);
    let ts = "1700000000";
    let body = br#"{"eventId":"1"}"#;
    let mal = "v1=deadbeef";
    assert!(verify_samsara_signature(&secret_b64, ts, body, mal).is_err());
}
