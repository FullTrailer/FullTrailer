<img src="https://res.cloudinary.com/dbt0nduzg/image/upload/v1762828566/fulltrailer-tractor-removebg-preview_bxnboh.png" alt="Truck" style="zoom:55%;" />

## FullTrailer

Servidor en **Rust** que conecta **webhooks de Samsara** (GPS y alertas) con **WhatsApp Business Cloud API** y **OpenAI**, para avisar a operadores y monitoristas del estado de camiones y choferes. Incluye **SQLite**, memoria en **Markdown**, scheduler diario de ausencias y **dashboard web** en el puerto configurado (por defecto `3000`).

### Rama de trabajo

Git no permite espacios en nombres de rama. Usa la rama **`Cambios-de-Simon`** (equivalente a *Cambios de Simon*).

### Inicio rápido

1. Copia `.env.example` a `.env` y completa tokens y teléfonos.
2. `WHATSAPP_DRY_RUN=true` evita llamadas reales a Meta mientras no haya API de WhatsApp.
3. Ejecuta `cargo run` desde la raíz del repositorio.
4. Dashboard: `http://localhost:3000` · Webhook: `POST /webhook/samsara` · Salud: `GET /health`.

Documentación adicional: `docs/setup.md`, `docs/architecture.md`, `docs/samsara-events.md`.

### Stack

Ver `Cargo.toml` — Axum, Tokio, SQLx (SQLite), reqwest, Tera, cron scheduler, HMAC-SHA256 para firmas Samsara.
