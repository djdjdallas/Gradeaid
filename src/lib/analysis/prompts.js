import { responseTemplate } from "../templates";

/**
 * Creates the analysis prompt for a specific subject and text
 * @param {string} subject - The subject being analyzed
 * @param {string} text - The text to analyze
 * @returns {string} - The complete analysis prompt
 */
export function createAnalysisPrompt(subject, text) {
  return `
You are an experienced ${subject} teacher using an advanced AI-powered grading system. 
Analyze this assignment comprehensively.

Here's the student's assignment:
${text}

Provide a detailed analysis that includes:

1. Per Question Analysis:
   - Accuracy and scoring
   - Detailed process evaluation
   - Completeness assessment
   - Presentation evaluation
   - Specific feedback
   - Common mistakes identification
   - Concepts being tested
   - Learning objectives addressed
   - Remedial suggestions
   - Challenge extensions for mastery

2. Overall Assessment:
   - Technical skills evaluation with progress indicators
   - Conceptual understanding with mastery tracking
   - Detailed strengths and weaknesses
   - Skill gap analysis (critical/moderate/minor)
   - Personalized learning path recommendations
   - Next steps for improvement

3. Subject-Specific Criteria:
${getSubjectSpecificCriteria(subject)}

Your response must be a precise JSON object matching this structure:
${JSON.stringify(responseTemplate, null, 2)}

Focus on:
- Clear, actionable feedback
- Specific areas for improvement
- Recognition of strengths
- Detailed explanation of errors
- Subject-appropriate evaluation
`;
}

/**
 * Returns subject-specific evaluation criteria
 * @param {string} subject - The subject being analyzed
 * @returns {string} - Subject-specific evaluation criteria
 */
function getSubjectSpecificCriteria(subject) {
  const subjectLower = subject.toLowerCase();

  const criteria = {
    math: `
   - Problem-solving methodology
   - Mathematical reasoning
   - Calculation accuracy
   - Show of work completeness
   - Formula application
   - Numerical precision`,

    english: `
   - Writing clarity
   - Grammar and syntax
   - Argument structure
   - Evidence usage
   - Literary analysis
   - Vocabulary application`,

    science: `
   - Scientific method application
   - Data analysis
   - Experimental design
   - Hypothesis formation
   - Results interpretation
   - Technical accuracy`,

    default: `
   - Subject knowledge
   - Analysis depth
   - Content organization
   - Technical accuracy
   - Comprehension level
   - Application of concepts`,
  };

  return criteria[subjectLower] || criteria.default;
}

/**
 * Formats the final prompt with additional instructions
 * @param {string} basePrompt - The base analysis prompt
 * @returns {string} - The complete prompt with formatting instructions
 */
export function formatFinalPrompt(basePrompt) {
  return `${basePrompt}

IMPORTANT RESPONSE INSTRUCTIONS:
1. Respond with ONLY a valid JSON object
2. Do not include any text, markdown, or formatting before or after the JSON
3. The response must start with "{" and end with "}"
4. Follow the exact structure provided in the template
5. Ensure all values match the expected types
6. Include detailed explanations in feedback fields`;
}
