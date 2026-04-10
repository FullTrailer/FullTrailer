# Reglas para Cursor — FullTrailer

## Git
- SIEMPRE trabajar en la rama "Cambios de Simon" (en Git sin espacios: `Cambios-de-Simon`)
- NUNCA commitear a main o master
- Commits en español, descriptivos

## Código
- Rust idiomático: usar ? para propagación de errores, anyhow para error handling
- Todo async/await con tokio
- Loggear con tracing, no con println!
- Responder 200 a Samsara SIEMPRE, procesar en background con tokio::spawn

## Samsara
- Verificar firma HMAC antes de procesar cualquier webhook
- Soportar tanto v1.0 (alertas) como v2.0 (event subscriptions)
- El secret está en Base64 — decodificar antes de usar en HMAC

## WhatsApp
- Números en formato internacional sin + (ej: 5215512345678)
- API endpoint: graph.facebook.com/v19.0/{phone_number_id}/messages
- Siempre notificar a monitorista además del operador

## Memoria
- Cada chofer tiene su .md en memory/drivers/{id}.md
- Loggear todas las alertas en memory/alerts-history.md
- SQLite es la fuente de verdad para queries; markdown es contexto del agente

## IA
- Usar gpt-4o-mini para ahorrar costos
- Sistema prompt: español mexicano informal, máximo 2 oraciones, sin inventar datos
- Si la IA falla, usar mensaje de fallback hardcodeado, nunca crashear
