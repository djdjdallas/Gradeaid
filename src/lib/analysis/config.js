/**
 * Configuration for the analysis module
 */
export const ANALYSIS_CONFIG = {
  model: "claude-3-sonnet-20240229",
  maxTokens: 4000,
  temperature: 0.1,
  maxTextLength: 12000,
};

/**
 * System prompts for different analysis types
 */
export const SYSTEM_PROMPTS = {
  default:
    "You are a mathematics teacher. Respond with ONLY valid JSON matching the exact structure provided. Do not include any additional text or formatting.",
  math: "You are an experienced mathematics teacher specializing in detailed problem solving analysis. Respond with ONLY valid JSON matching the exact structure provided.",
  english:
    "You are an experienced English teacher specializing in writing and comprehension analysis. Respond with ONLY valid JSON matching the exact structure provided.",
  science:
    "You are an experienced science teacher specializing in scientific method and experimental analysis. Respond with ONLY valid JSON matching the exact structure provided.",
};

/**
 * Error messages for the analysis module
 */
export const ERROR_MESSAGES = {
  invalidInput: "Invalid input provided for analysis",
  missingSubject: "Subject is required for analysis",
  missingText: "Text content is required for analysis",
  analysisFailure: "Analysis failed to complete",
  parseFailure: "Failed to parse analysis response",
  invalidJson: "Invalid JSON structure in response",
};
