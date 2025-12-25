use anyhow::Result;
use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub gemini_api_key: String,
    pub prompts_dir: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()?,
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://localhost/ib_quiz".to_string()),
            gemini_api_key: env::var("GEMINI_API_KEY").unwrap_or_default(),
            prompts_dir: env::var("PROMPTS_DIR").unwrap_or_else(|_| "./prompts".to_string()),
        })
    }
}
