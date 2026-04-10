use anyhow::Result;
use tokio_cron_scheduler::{Job, JobScheduler};
use tracing::info;

use crate::{agents::absence_detector, AppState};

pub async fn start(state: AppState) -> Result<()> {
    let sched = JobScheduler::new().await?;

    // Check de ausencias todos los días a las 7:00 AM hora local
    let state_clone = state.clone();
    let job = Job::new_async("0 0 7 * * *", move |_uuid, _lock| {
        let s = state_clone.clone();
        Box::pin(async move {
            info!("Scheduler: iniciando check de ausencias...");
            if let Err(e) = absence_detector::check_all_absences(&s).await {
                tracing::error!("Error en check_absences: {}", e);
            }
        })
    })?;

    sched.add(job).await?;
    sched.start().await?;

    info!("Scheduler iniciado — check de ausencias a las 7:00 AM diario");
    Ok(())
}
