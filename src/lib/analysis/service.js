import { Anthropic } from "@anthropic-ai/sdk";
import { ANALYSIS_CONFIG, SYSTEM_PROMPTS, ERROR_MESSAGES } from "./config";
import { createAnalysisPrompt, formatFinalPrompt } from "./prompts";
import { cleanResponseText } from "../utils";
import { responseTemplate } from "../templates";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Validates input parameters for analysis
 * @param {string} text - The text to analyze
 * @param {string} subject - The subject to analyze for
 * @returns {Object} - Validation result
 */
function validateInput(text, subject) {
  if (!text || typeof text !== "string") {
    return { isValid: false, error: ERROR_MESSAGES.missingText };
  }
  if (!subject || typeof subject !== "string") {
    return { isValid: false, error: ERROR_MESSAGES.missingSubject };
  }
  return { isValid: true };
}

/**
 * Processes and analyzes text using Claude
 * @param {string} text - The text to analyze
 * @param {string} subject - The subject to analyze for
 * @returns {Promise<Object>} - Analysis result
 * @throws {Error} - If analysis fails
 */
export async function analyzeWithClaude(text, subject) {
  console.log("Starting Claude analysis for subject:", subject);

  // Validate inputs
  const validation = validateInput(text, subject);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    // Prepare text and prompt
    const analysisText = prepareText(text);
    const basePrompt = createAnalysisPrompt(subject, analysisText);
    const finalPrompt = formatFinalPrompt(basePrompt);

    // Get analysis from Claude
    const completion = await requestAnalysis(finalPrompt, subject);

    // Parse and validate response
    const result = parseAnalysisResponse(completion.content[0].text);

    return validateAndEnhanceResult(result, subject);
  } catch (error) {
    console.error("Error in analyzeWithClaude:", error);
    throw new Error(`${ERROR_MESSAGES.analysisFailure}: ${error.message}`);
  }
}

/**
 * Prepares text for analysis by truncating if necessary
 * @param {string} text - The text to prepare
 * @returns {string} - Prepared text
 */
function prepareText(text) {
  if (text.length > ANALYSIS_CONFIG.maxTextLength) {
    return (
      text.slice(0, ANALYSIS_CONFIG.maxTextLength) +
      "\n[Content truncated for length]"
    );
  }
  return text;
}

/**
 * Makes the API request to Claude
 * @param {string} prompt - The complete prompt
 * @param {string} subject - The subject being analyzed
 * @returns {Promise<Object>} - Claude's response
 */
async function requestAnalysis(prompt, subject) {
  const subjectLower = subject.toLowerCase();
  const systemPrompt = SYSTEM_PROMPTS[subjectLower] || SYSTEM_PROMPTS.default;

  return await anthropic.messages.create({
    model: ANALYSIS_CONFIG.model,
    max_tokens: ANALYSIS_CONFIG.maxTokens,
    temperature: ANALYSIS_CONFIG.temperature,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    system: systemPrompt,
  });
}

/**
 * Parses and validates Claude's response
 * @param {string} responseText - The raw response text
 * @returns {Object} - Parsed response
 */
function parseAnalysisResponse(responseText) {
  responseText = responseText.trim();
  console.log("Response text before cleaning:", responseText);

  // Clean and validate response
  responseText = cleanResponseText(responseText);

  if (!responseText.startsWith("{") || !responseText.endsWith("}")) {
    console.error("Invalid JSON structure:", responseText);
    return responseTemplate;
  }

  try {
    return JSON.parse(responseText);
  } catch (firstError) {
    console.error("First parse attempt failed:", firstError);
    try {
      const match = responseText.match(/{[\s\S]*}/);
      if (match) {
        const result = JSON.parse(match[0]);
        return result;
      }
    } catch (secondError) {
      console.error("Second parse attempt failed:", secondError);
    }
    console.error("All parsing attempts failed. Returning template.");
    return responseTemplate;
  }
}

/**
 * Validates and enhances the analysis result
 * @param {Object} result - The parsed analysis result
 * @param {string} subject - The subject analyzed
 * @returns {Object} - Validated and enhanced result
 */
function validateAndEnhanceResult(result, subject) {
  // Ensure all required fields exist
  result.questions = result.questions || [];
  result.overallAssessment = result.overallAssessment || {};
  result.meta = result.meta || {};

  // Add metadata
  result.meta.analysisTimestamp = new Date().toISOString();
  result.meta.subject = subject;
  result.meta.modelVersion = ANALYSIS_CONFIG.model;

  return result;
}
