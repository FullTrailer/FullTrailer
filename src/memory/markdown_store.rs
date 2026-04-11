// Cada chofer y camión tiene su propio archivo .md como memoria del agente
// Se lee antes de tomar decisiones y se actualiza después de cada evento

use anyhow::Result;
use chrono::Local;
use std::path::PathBuf;
use tokio::fs;

pub struct MarkdownStore {
    base_path: PathBuf,
}

impl MarkdownStore {
    pub fn new(base_path: &str) -> Self {
        Self {
            base_path: PathBuf::from(base_path),
        }
    }

    pub async fn get_driver_memory(&self, driver_id: &str) -> Option<String> {
        let path = self.base_path.join("drivers").join(format!("{}.md", driver_id));
        fs::read_to_string(path).await.ok()
    }

    pub async fn update_driver_memory(
        &self,
        driver_id: &str,
        driver_name: &str,
        status: &str,
        extra_entry: &str,
    ) -> Result<()> {
        let path = self
            .base_path
            .join("drivers")
            .join(format!("{}.md", driver_id));

        // Leer memoria existente o crear nueva
        let existing = fs::read_to_string(&path).await.unwrap_or_default();
        let now = Local::now().format("%Y-%m-%d %H:%M").to_string();

        // Si no existe, crear estructura base
        let updated = if existing.is_empty() {
            format!(
                "# {} — ID: {}\n**Estado:** {}\n**Última actualización:** {}\n\n## Historial\n- {} — {}\n",
                driver_name, driver_id, status, now, now, extra_entry
            )
        } else {
            // Actualizar estado y agregar entrada al historial
            let updated_status = update_field(&existing, "**Estado:**", status);
            let updated_date = update_field(&updated_status, "**Última actualización:**", &now);
            // Agregar al historial
            let entry = format!("- {} — {}", now, extra_entry);
            if let Some(hist_pos) = updated_date.find("## Historial\n") {
                let insert_pos = hist_pos + "## Historial\n".len();
                let mut result = updated_date.clone();
                result.insert_str(insert_pos, &format!("{}\n", entry));
                result
            } else {
                format!("{}\n## Historial\n{}\n", updated_date, entry)
            }
        };

        fs::create_dir_all(path.parent().unwrap()).await?;
        fs::write(path, updated).await?;
        Ok(())
    }

    pub async fn log_alert(&self, alert_type: &str, recipient: &str, message: &str) -> Result<()> {
        let path = self.base_path.join("alerts-history.md");
        let now = Local::now().format("%Y-%m-%d %H:%M").to_string();
        let entry = format!("- {} | {} | {} | {}\n", now, alert_type, recipient, message);

        let existing = fs::read_to_string(&path).await.unwrap_or_default();
        fs::write(path, format!("{}{}", existing, entry)).await?;
        Ok(())
    }
}

fn update_field(content: &str, field: &str, new_value: &str) -> String {
    let lines: Vec<&str> = content.lines().collect();
    let updated: Vec<String> = lines
        .iter()
        .map(|line| {
            if line.starts_with(field) {
                format!("{} {}", field, new_value)
            } else {
                line.to_string()
            }
        })
        .collect();
    updated.join("\n")
}
