mod config;
mod db;
mod error;
mod models;
mod routes;
mod services;

use std::path::PathBuf;
use std::sync::Arc;

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::db::Database;
use crate::services::PromptLoader;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub config: Config,
    pub http_client: reqwest::Client,
    pub prompt_loader: Arc<PromptLoader>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load config
    dotenvy::dotenv().ok();
    let config = Config::from_env()?;

    tracing::info!("Starting IB Quiz Backend on {}:{}", config.host, config.port);

    // Initialize database
    let db = Database::new(&config.database_url).await?;
    db.run_migrations().await?;

    // Initialize prompt loader
    let prompt_loader = Arc::new(PromptLoader::new(PathBuf::from(&config.prompts_dir)));
    tracing::info!("Prompts directory: {}", config.prompts_dir);

    // Create app state
    let state = AppState {
        db,
        config: config.clone(),
        http_client: reqwest::Client::new(),
        prompt_loader,
    };

    // CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        // Health check
        .route("/health", get(routes::health))
        // Question generation
        .route("/api/generate-question", post(routes::question::generate_question))
        // Quiz routes
        .route("/api/quiz", post(routes::quiz::create_new_quiz))
        .route("/api/quiz/:id", get(routes::quiz::get_existing_quiz))
        .route("/api/quiz/next", get(routes::quiz::get_next_question))
        .route("/api/quiz/submit", post(routes::quiz::submit_answer))
        .route("/api/quiz/history", get(routes::quiz::get_history))
        // Progress routes
        .route("/api/progress", get(routes::progress::get_progress))
        .route("/api/progress/topics", get(routes::progress::get_topic_progress))
        // OCR route
        .route("/api/ocr", post(routes::ocr::ocr_image))
        // Middleware
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    // Start server
    let listener = tokio::net::TcpListener::bind(format!("{}:{}", config.host, config.port))
        .await?;

    tracing::info!("Server listening on http://{}:{}", config.host, config.port);

    axum::serve(listener, app).await?;

    Ok(())
}
