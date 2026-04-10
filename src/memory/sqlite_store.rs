use anyhow::Result;
use chrono::{NaiveDateTime, Utc};
use sqlx::sqlite::SqlitePool;
use sqlx::Row;

pub struct SqliteStore {
    pool: SqlitePool,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct DriverRow {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub status: String,
    pub last_trip_at: Option<NaiveDateTime>,
    pub current_truck_id: Option<String>,
    pub days_absent: i64,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct TruckRow {
    pub id: String,
    pub name: String,
    pub vin: Option<String>,
    pub status: String,
    pub last_location: Option<String>,
    pub last_seen_at: Option<NaiveDateTime>,
    pub current_driver_id: Option<String>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct AlertRow {
    pub id: i64,
    pub alert_type: String,
    pub recipient_phone: String,
    pub message: String,
    pub sent_at: NaiveDateTime,
    pub truck_id: Option<String>,
    pub driver_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct AbsentDriver {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub days_absent: i64,
}

impl SqliteStore {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = SqlitePool::connect(database_url).await?;
        let migration = include_str!("../../migrations/001_initial.sql");
        for stmt in migration.split(';') {
            let s = stmt.trim();
            if s.is_empty() {
                continue;
            }
            sqlx::query(s).execute(&pool).await?;
        }
        Ok(Self { pool })
    }

    pub async fn get_driver(&self, id: &str) -> Result<Option<DriverRow>> {
        let row = sqlx::query_as::<_, DriverRow>(
            "SELECT id, name, phone, status, last_trip_at, current_truck_id, days_absent FROM drivers WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row)
    }

    /// Inserta o actualiza chofer a partir de un webhook. No sobrescribe el teléfono si ya existía.
    pub async fn upsert_driver(&self, id: &str, name: &str, default_phone: &str) -> Result<()> {
        let now = Utc::now().naive_utc();
        sqlx::query(
            r#"
            INSERT INTO drivers (id, name, phone, status, updated_at)
            VALUES (?, ?, ?, 'active', ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              status = 'active',
              updated_at = excluded.updated_at
            "#,
        )
        .bind(id)
        .bind(name)
        .bind(default_phone)
        .bind(now)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn upsert_truck(
        &self,
        id: &str,
        name: &str,
        status: &str,
        last_location: Option<&str>,
    ) -> Result<()> {
        let now = Utc::now().naive_utc();
        sqlx::query(
            r#"
            INSERT INTO trucks (id, name, status, last_location, last_seen_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              status = excluded.status,
              last_location = excluded.last_location,
              last_seen_at = excluded.last_seen_at,
              updated_at = excluded.updated_at
            "#,
        )
        .bind(id)
        .bind(name)
        .bind(status)
        .bind(last_location)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn update_driver_last_trip(&self, id: &str) -> Result<()> {
        let now = Utc::now().naive_utc();
        let res = sqlx::query(
            r#"
            UPDATE drivers SET
              last_trip_at = ?,
              days_absent = 0,
              status = 'active',
              updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(now)
        .bind(now)
        .bind(id)
        .execute(&self.pool)
        .await?;

        if res.rows_affected() == 0 {
            sqlx::query(
                r#"INSERT INTO drivers (id, name, phone, status, last_trip_at, updated_at)
                   VALUES (?, 'Sin nombre en BD', '000000000000', 'active', ?, ?)"#,
            )
            .bind(id)
            .bind(now)
            .bind(now)
            .execute(&self.pool)
            .await?;
        }
        Ok(())
    }

    pub async fn get_absent_drivers(&self, threshold_days: i64) -> Result<Vec<AbsentDriver>> {
        let rows = sqlx::query(
            r#"
            SELECT
              id,
              name,
              phone,
              CAST((julianday('now') - julianday(COALESCE(last_trip_at, created_at))) AS INTEGER) AS absent_days
            FROM drivers
            WHERE (julianday('now') - julianday(COALESCE(last_trip_at, created_at))) >= ?
            "#,
        )
        .bind(threshold_days)
        .fetch_all(&self.pool)
        .await?;

        let mut out = Vec::new();
        for r in rows {
            out.push(AbsentDriver {
                id: r.try_get("id")?,
                name: r.try_get("name")?,
                phone: r.try_get("phone")?,
                days_absent: r.try_get::<i64, _>("absent_days")?,
            });
        }
        Ok(out)
    }

    pub async fn list_trucks(&self) -> Result<Vec<TruckRow>> {
        let rows = sqlx::query_as::<_, TruckRow>(
            "SELECT id, name, vin, status, last_location, last_seen_at, current_driver_id FROM trucks ORDER BY name",
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    pub async fn list_recent_alerts(&self, limit: i64) -> Result<Vec<AlertRow>> {
        let rows = sqlx::query_as::<_, AlertRow>(
            r#"SELECT id, alert_type, recipient_phone, message, sent_at, truck_id, driver_id
               FROM alerts ORDER BY sent_at DESC LIMIT ?"#,
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    pub async fn insert_event(
        &self,
        id: &str,
        event_type: &str,
        truck_id: Option<&str>,
        driver_id: Option<&str>,
        payload: &str,
    ) -> Result<()> {
        sqlx::query(
            "INSERT OR IGNORE INTO events (id, event_type, truck_id, driver_id, payload) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(event_type)
        .bind(truck_id)
        .bind(driver_id)
        .bind(payload)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn insert_alert(
        &self,
        alert_type: &str,
        recipient_phone: &str,
        message: &str,
        truck_id: Option<&str>,
        driver_id: Option<&str>,
    ) -> Result<()> {
        sqlx::query(
            r#"INSERT INTO alerts (alert_type, recipient_phone, message, truck_id, driver_id)
               VALUES (?, ?, ?, ?, ?)"#,
        )
        .bind(alert_type)
        .bind(recipient_phone)
        .bind(message)
        .bind(truck_id)
        .bind(driver_id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
