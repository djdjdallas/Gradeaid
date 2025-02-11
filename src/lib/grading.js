/**
 * Constants for grading calculations
 */
const SCORE_WEIGHTS = {
  technicalSkills: 0.3,
  conceptualUnderstanding: 0.3,
  questionAccuracy: 0.4,
};

const SCORE_MULTIPLIERS = {
  skillToPercentage: 20, // Converts 0-5 scale to percentage
};

/**
 * Validates the structure of an analysis result
 * @param {Object} analysisResult - The analysis result to validate
 * @returns {Object} - Object containing validation result and any error messages
 */
function validateAnalysisResult(analysisResult) {
  if (!analysisResult) {
    return { isValid: false, error: "Analysis result is required" };
  }

  if (!Array.isArray(analysisResult.questions)) {
    return { isValid: false, error: "Questions array is required" };
  }

  if (!analysisResult.overallAssessment) {
    return { isValid: false, error: "Overall assessment is required" };
  }

  return { isValid: true };
}

/**
 * Calculates the score for a math assignment based on question accuracy
 * @param {Object} analysisResult - The complete analysis result
 * @returns {number} - Score as a percentage (0-100)
 * @throws {Error} - If the analysis result is invalid
 */
function calculateMathScore(analysisResult) {
  const validation = validateAnalysisResult(analysisResult);
  if (!validation.isValid) {
    throw new Error(`Invalid analysis result: ${validation.error}`);
  }

  try {
    const correctQuestions = analysisResult.questions.filter(
      (q) => q.accuracy
    ).length;
    const totalQuestions = analysisResult.questions.length || 1;

    return Math.round((correctQuestions / totalQuestions) * 100);
  } catch (error) {
    console.error("Error calculating math score:", error);
    throw new Error("Failed to calculate math score: " + error.message);
  }
}

/**
 * Calculates weighted score for non-math subjects based on multiple criteria
 * @param {Object} analysisResult - The complete analysis result
 * @returns {number} - Score as a percentage (0-100)
 * @throws {Error} - If the analysis result is invalid
 */
function calculateWeightedScore(analysisResult) {
  const validation = validateAnalysisResult(analysisResult);
  if (!validation.isValid) {
    throw new Error(`Invalid analysis result: ${validation.error}`);
  }

  try {
    // Calculate technical skills score (0-5 scale to percentage)
    const technicalScore =
      (analysisResult.overallAssessment?.technicalSkills?.score || 0) *
      SCORE_MULTIPLIERS.skillToPercentage;

    // Calculate conceptual understanding score (0-5 scale to percentage)
    const conceptualScore =
      (analysisResult.overallAssessment?.conceptualUnderstanding?.score || 0) *
      SCORE_MULTIPLIERS.skillToPercentage;

    // Calculate accuracy score (percentage of correct questions)
    const correctQuestions = analysisResult.questions.filter(
      (q) => q.accuracy
    ).length;
    const totalQuestions = analysisResult.questions.length || 1;
    const accuracyScore = (correctQuestions / totalQuestions) * 100;

    // Calculate weighted total
    const weightedScore =
      technicalScore * SCORE_WEIGHTS.technicalSkills +
      conceptualScore * SCORE_WEIGHTS.conceptualUnderstanding +
      accuracyScore * SCORE_WEIGHTS.questionAccuracy;

    return Math.round(weightedScore);
  } catch (error) {
    console.error("Error calculating weighted score:", error);
    throw new Error("Failed to calculate weighted score: " + error.message);
  }
}

/**
 * Calculates the overall score for an assignment based on subject
 * @param {Object} analysisResult - The complete analysis result
 * @param {string} subject - The subject being graded
 * @returns {number} - Score as a percentage (0-100)
 * @throws {Error} - If the inputs are invalid or calculation fails
 */
export function calculateScore(analysisResult, subject) {
  if (!subject) {
    throw new Error("Subject is required");
  }

  // Validate analysis result
  const validation = validateAnalysisResult(analysisResult);
  if (!validation.isValid) {
    throw new Error(`Invalid analysis result: ${validation.error}`);
  }

  try {
    const subjectLower = subject.toLowerCase();
    const isMathSubject =
      subjectLower === "math" || subjectLower === "mathematics";

    // Log calculation attempt
    console.log(`Calculating score for ${subject} assignment...`);
    console.log(
      `Using ${isMathSubject ? "accuracy-based" : "weighted"} scoring method`
    );

    // Calculate score based on subject type
    const score = isMathSubject
      ? calculateMathScore(analysisResult)
      : calculateWeightedScore(analysisResult);

    // Validate final score
    if (isNaN(score) || score < 0 || score > 100) {
      throw new Error(`Invalid score calculated: ${score}`);
    }

    console.log(`Final score calculated: ${score}%`);
    return score;
  } catch (error) {
    console.error("Error in calculateScore:", error);
    throw new Error(`Failed to calculate score: ${error.message}`);
  }
}

/**
 * Returns the grading method used for a given subject
 * @param {string} subject - The subject being graded
 * @returns {string} - Either "accuracy_only" or "weighted_criteria"
 */
export function getGradingMethod(subject) {
  const subjectLower = subject.toLowerCase();
  return subjectLower === "math" || subjectLower === "mathematics"
    ? "accuracy_only"
    : "weighted_criteria";
}

/**
 * Returns the scoring weights used for weighted grading
 * @returns {Object} - The scoring weights configuration
 */
export function getScoringWeights() {
  return { ...SCORE_WEIGHTS };
}
