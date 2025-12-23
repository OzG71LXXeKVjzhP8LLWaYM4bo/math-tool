use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tracing::debug;

const DEFAULT_PROMPT: &str = r#"Generate an IB Higher Level {{subject}} exam-style question on the topic of {{topic}}.

Requirements:
- Question must match the style and rigor of actual IB HL exams
- Include numerical values where appropriate
- Question should be solvable analytically
- Use proper LaTeX notation for all mathematical expressions

The solution_steps field is required because the app displays step-by-step worked solutions to help students learn the problem-solving process, similar to IB mark schemes.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "LaTeX code for the question",
  "answer": "LaTeX code for the final answer",
  "solution_steps": [
    {"step": 1, "description": "First step description", "expression": "LaTeX expression"},
    {"step": 2, "description": "Second step description", "expression": "LaTeX expression"}
  ],
  "hints": ["hint1", "hint2"]
}"#;

pub struct PromptLoader {
    prompts_dir: PathBuf,
}

impl PromptLoader {
    pub fn new(prompts_dir: PathBuf) -> Self {
        debug!("Initializing PromptLoader with dir: {:?}", prompts_dir);
        Self { prompts_dir }
    }

    /// Load a prompt template, checking for subject-specific override first.
    /// Falls back to default prompt if file doesn't exist.
    pub fn load(&self, name: &str, subject: Option<&str>) -> String {
        // Try subject-specific first: prompts/math/question_generation.txt
        if let Some(subj) = subject {
            let path = self.prompts_dir.join(subj).join(format!("{}.txt", name));
            debug!("Trying subject-specific prompt: {:?}", path);
            if let Ok(content) = fs::read_to_string(&path) {
                debug!("Loaded subject-specific prompt for {}", subj);
                return content;
            }
        }

        // Fall back to default: prompts/question_generation.txt
        let path = self.prompts_dir.join(format!("{}.txt", name));
        debug!("Trying default prompt: {:?}", path);
        if let Ok(content) = fs::read_to_string(&path) {
            debug!("Loaded default prompt");
            return content;
        }

        // Fall back to hardcoded default
        debug!("Using hardcoded default prompt");
        DEFAULT_PROMPT.to_string()
    }

    /// Render a prompt template with variable substitution.
    /// Variables use {{variable}} syntax.
    pub fn render(&self, template: &str, vars: &HashMap<&str, String>) -> String {
        let mut result = template.to_string();
        for (key, value) in vars {
            result = result.replace(&format!("{{{{{}}}}}", key), value);
        }
        result
    }

    /// Load and render a prompt in one step
    pub fn load_and_render(
        &self,
        name: &str,
        subject: Option<&str>,
        vars: &HashMap<&str, String>,
    ) -> String {
        let template = self.load(name, subject);
        self.render(&template, vars)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_render_substitution() {
        let loader = PromptLoader::new(PathBuf::from("./prompts"));
        let template = "Hello {{name}}, your score is {{score}}";
        let mut vars = HashMap::new();
        vars.insert("name", "Alice".to_string());
        vars.insert("score", "95".to_string());

        let result = loader.render(template, &vars);
        assert_eq!(result, "Hello Alice, your score is 95");
    }

    #[test]
    fn test_fallback_to_default() {
        let loader = PromptLoader::new(PathBuf::from("/nonexistent"));
        let prompt = loader.load("question_generation", Some("math"));
        assert!(prompt.contains("Generate an IB Higher Level"));
    }
}
