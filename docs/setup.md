# Configuración — FullTrailer

## Requisitos

- Rust (edition 2021)
- Cuenta Samsara con webhooks y token de API
- (Opcional) WhatsApp Business Cloud API — usar `WHATSAPP_DRY_RUN=true` mientras no haya credenciales
- Clave OpenAI para redacción de mensajes

## Pasos

1. Copiar `.env.example` a `.env` y completar valores.
2. `cargo run` desde la raíz del proyecto.
3. Abrir `http://localhost:3000` (o el puerto en `PORT`).
4. Para pruebas locales del webhook Samsara, exponer el puerto con un túnel HTTPS (por ejemplo ngrok) y registrar la URL en el panel de Samsara.

## Base de datos

La URL por defecto es `sqlite://fulltrailer.db`. Las tablas se crean al arranque a partir de `migrations/001_initial.sql`.

## Modo simulación WhatsApp

Con `WHATSAPP_DRY_RUN=true`, los mensajes no se envían a Meta; solo se registran en logs (`tracing`).
