use anyhow::Result;

#[derive(Clone, Debug)]
pub struct Config {
    pub samsara_api_token: String,
    pub samsara_webhook_secret: String,
    pub whatsapp_token: String,
    pub whatsapp_phone_number_id: String,
    pub whatsapp_dry_run: bool,
    pub openai_api_key: String,
    pub port: u16,
    pub database_url: String,
    pub monitor_phone: String,
    pub absence_threshold_days: i64,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();
        Ok(Config {
            samsara_api_token: std::env::var("SAMSARA_API_TOKEN")?,
            samsara_webhook_secret: std::env::var("SAMSARA_WEBHOOK_SECRET")?,
            whatsapp_token: std::env::var("WHATSAPP_TOKEN").unwrap_or_default(),
            whatsapp_phone_number_id: std::env::var("WHATSAPP_PHONE_NUMBER_ID").unwrap_or_default(),
            whatsapp_dry_run: std::env::var("WHATSAPP_DRY_RUN")
                .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
                .unwrap_or(false),
            openai_api_key: std::env::var("OPENAI_API_KEY")?,
            port: std::env::var("PORT").unwrap_or("3000".into()).parse()?,
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or("sqlite://fulltrailer.db".into()),
            monitor_phone: std::env::var("MONITOR_PHONE")?,
            absence_threshold_days: std::env::var("ABSENCE_THRESHOLD_DAYS")
                .unwrap_or("3".into())
                .parse()?,
        })
    }
}
