import { ConceptualUnderstanding } from "./ConceptualUnderstanding";
import { TechnicalSkills } from "./TechnicalSkills";

export function OverallAssessment({ assessment, subject }) {
  // Helper functions for safe array operations
  const safeArrayLength = (arr) => (Array.isArray(arr) ? arr.length : 0);
  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  // Score normalization function
  const normalizeScore = (score, maxPossible = 100) => {
    const numberScore = Number(score) || 0;
    return Math.min(Math.max(numberScore, 0), maxPossible);
  };

  // Early return if no assessment data
  if (!assessment) return null;

  // Normalize assessment scores before rendering
  const normalizedAssessment = {
    ...assessment,
    totalScore: normalizeScore(assessment.totalScore),
    technicalSkills: assessment.technicalSkills
      ? {
          ...assessment.technicalSkills,
          score: normalizeScore(assessment.technicalSkills.score, 5), // 5-point scale
        }
      : null,
    conceptualUnderstanding: assessment.conceptualUnderstanding
      ? {
          ...assessment.conceptualUnderstanding,
          score: normalizeScore(assessment.conceptualUnderstanding.score, 5), // 5-point scale
        }
      : null,
  };

  // Determine if this is a math/technical subject
  const isMathSubject =
    subject?.toLowerCase() === "math" ||
    subject?.toLowerCase() === "mathematics";

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="font-medium mb-2">Overall Assessment</h4>

      {/* Overall Score Display */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">Overall Score:</p>
          <p
            className={`text-lg font-bold ${
              normalizedAssessment.totalScore >= 70
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {normalizedAssessment.totalScore}%
          </p>
        </div>
      </div>

      {/* Skills Assessment */}
      {!isMathSubject && (
        <>
          <TechnicalSkills skills={normalizedAssessment.technicalSkills} />
          <ConceptualUnderstanding
            understanding={normalizedAssessment.conceptualUnderstanding}
          />
        </>
      )}

      {/* Major Strengths Section */}
      {safeArrayLength(normalizedAssessment.majorStrengths) > 0 && (
        <div className="mt-4">
          <strong className="text-sm">Major Strengths:</strong>
          <ul className="mt-2 space-y-1">
            {safeArray(normalizedAssessment.majorStrengths).map(
              (strength, idx) => (
                <li
                  key={idx}
                  className="text-sm text-green-600 dark:text-green-400 flex items-start"
                >
                  <span className="mr-2">•</span>
                  <span>{strength}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Areas for Improvement Section */}
      {safeArrayLength(normalizedAssessment.areasForImprovement) > 0 && (
        <div className="mt-4">
          <strong className="text-sm">Areas for Improvement:</strong>
          <ul className="mt-2 space-y-1">
            {safeArray(normalizedAssessment.areasForImprovement).map(
              (area, idx) => (
                <li
                  key={idx}
                  className="text-sm text-red-600 dark:text-red-400 flex items-start"
                >
                  <span className="mr-2">•</span>
                  <span>{area}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Recommendations Section */}
      {safeArrayLength(normalizedAssessment.recommendations) > 0 && (
        <div className="mt-4">
          <strong className="text-sm">Recommendations:</strong>
          <ul className="mt-2 space-y-1">
            {safeArray(normalizedAssessment.recommendations).map((rec, idx) => (
              <li
                key={idx}
                className="text-sm text-blue-600 dark:text-blue-400 flex items-start"
              >
                <span className="mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Learning Path */}
      {assessment.learningPath && (
        <div className="mt-4">
          <strong className="text-sm">Suggested Learning Path:</strong>
          <div className="mt-2 space-y-2">
            {assessment.learningPath.shortTerm && (
              <div>
                <p className="text-sm font-medium">Short Term:</p>
                <ul className="mt-1">
                  {safeArray(assessment.learningPath.shortTerm).map(
                    (goal, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-600 dark:text-gray-400 ml-4"
                      >
                        • {goal}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
            {assessment.learningPath.mediumTerm && (
              <div>
                <p className="text-sm font-medium">Medium Term:</p>
                <ul className="mt-1">
                  {safeArray(assessment.learningPath.mediumTerm).map(
                    (goal, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-600 dark:text-gray-400 ml-4"
                      >
                        • {goal}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
