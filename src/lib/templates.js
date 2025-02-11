/**
 * Template for analysis response structure
 * @typedef {Object} AnalysisTemplate
 */
export const responseTemplate = {
  questions: [
    {
      number: 0,
      accuracy: false,
      score: 0,
      processEvaluation: "",
      completenessEvaluation: "",
      presentationEvaluation: "",
      feedback: "",
      commonMistakes: [],
      conceptsCovered: [],
      learningObjectives: [],
      remedialSuggestions: [],
      challengeExtensions: [],
    },
  ],
  overallAssessment: {
    totalScore: 0,
    gradingMethod: "",
    technicalSkills: {
      score: 0,
      strengths: [],
      weaknesses: [],
      progressIndicators: {},
    },
    conceptualUnderstanding: {
      score: 0,
      strengths: [],
      weaknesses: [],
      keyConceptsMastery: {},
    },
    majorStrengths: [],
    areasForImprovement: [],
    recommendations: [],
    teacherSummary: "",
    learningPath: {
      shortTerm: [],
      mediumTerm: [],
      longTerm: [],
    },
    skillGaps: {
      critical: [],
      moderate: [],
      minor: [],
    },
    nextSteps: {
      practice: [],
      review: [],
      advance: [],
    },
  },
  meta: {
    subjectAlignment: [],
    difficultyDistribution: {},
    conceptCoverage: {},
    timeSpent: 0,
    complexityMetrics: {},
  },
};

/**
 * Deep clones the response template to ensure a fresh copy
 * @returns {AnalysisTemplate} A fresh copy of the response template
 */
export function getNewTemplate() {
  return JSON.parse(JSON.stringify(responseTemplate));
}

/**
 * Validates if a response matches the template structure
 * @param {Object} response - The response to validate
 * @returns {boolean} True if the response matches the template structure
 */
export function validateResponseStructure(response) {
  try {
    const requiredKeys = ["questions", "overallAssessment", "meta"];
    const missingKeys = requiredKeys.filter((key) => !(key in response));

    if (missingKeys.length > 0) {
      console.error("Missing required keys:", missingKeys);
      return false;
    }

    // Validate questions array
    if (!Array.isArray(response.questions)) {
      console.error("Questions must be an array");
      return false;
    }

    // Validate overallAssessment structure
    const requiredAssessmentKeys = [
      "totalScore",
      "technicalSkills",
      "conceptualUnderstanding",
      "learningPath",
    ];
    const missingAssessmentKeys = requiredAssessmentKeys.filter(
      (key) => !(key in response.overallAssessment)
    );

    if (missingAssessmentKeys.length > 0) {
      console.error("Missing required assessment keys:", missingAssessmentKeys);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating response structure:", error);
    return false;
  }
}

/**
 * Creates a minimal template for quick results
 * Useful for error cases or when full analysis isn't needed
 * @param {string} message - A message to include in the teacherSummary
 * @returns {AnalysisTemplate} A minimal valid template
 */
export function createMinimalTemplate(message = "") {
  return {
    questions: [
      {
        number: 0,
        accuracy: false,
        score: 0,
        processEvaluation: "Not evaluated",
        feedback: message,
      },
    ],
    overallAssessment: {
      totalScore: 0,
      gradingMethod: "minimal",
      technicalSkills: { score: 0 },
      conceptualUnderstanding: { score: 0 },
      teacherSummary: message,
      learningPath: {
        shortTerm: [],
        mediumTerm: [],
      },
    },
    meta: {
      timeSpent: 0,
    },
  };
}
