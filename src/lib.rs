//! FullTrailer — servidor de webhooks Samsara y notificaciones.

pub mod agents;
pub mod config;
pub mod dashboard;
pub mod error;
pub mod integrations;
pub mod memory;
pub mod scheduler;
pub mod webhooks;

use anyhow::Result;
use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::CorsLayer;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;
use tracing_subscriber::EnvFilter;

use config::Config;
use integrations::{ai::AiClient, whatsapp::WhatsAppClient};
use memory::{markdown_store::MarkdownStore, sqlite_store::SqliteStore};

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub whatsapp: Arc<WhatsAppClient>,
    pub ai: Arc<AiClient>,
    pub db: Arc<SqliteStore>,
    pub memory: Arc<MarkdownStore>,
    pub last_webhook_at: Arc<RwLock<Option<DateTime<Utc>>>>,
}

pub async fn run() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("fulltrailer=info".parse()?))
        .init();

    let config = Arc::new(Config::from_env()?);
    let db = Arc::new(SqliteStore::new(&config.database_url).await?);
    let whatsapp = Arc::new(WhatsAppClient::new(
        config.whatsapp_token.clone(),
        config.whatsapp_phone_number_id.clone(),
        config.whatsapp_dry_run,
    ));
    let ai = Arc::new(AiClient::new(config.openai_api_key.clone()));
    let memory = Arc::new(MarkdownStore::new("./memory"));

    let state = AppState {
        config: config.clone(),
        whatsapp,
        ai,
        db,
        memory,
        last_webhook_at: Arc::new(RwLock::new(None)),
    };

    let state_for_scheduler = state.clone();
    tokio::spawn(async move {
        if let Err(e) = scheduler::start(state_for_scheduler).await {
            tracing::error!("Error en scheduler: {}", e);
        }
    });

    let app = Router::new()
        .route("/", get(dashboard::index))
        .route("/webhook/samsara", post(webhooks::handle_samsara_webhook))
        .route("/health", get(|| async { "FullTrailer OK" }))
        .with_state(state)
        .layer(CorsLayer::permissive());

    let addr = format!("0.0.0.0:{}", config.port);
    info!("FullTrailer corriendo en http://{}", addr);
    info!("Dashboard: http://localhost:{}", config.port);
    info!(
        "Webhook Samsara: POST http://localhost:{}/webhook/samsara",
        config.port
    );

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
