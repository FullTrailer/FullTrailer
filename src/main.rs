use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    fulltrailer::run().await
}
