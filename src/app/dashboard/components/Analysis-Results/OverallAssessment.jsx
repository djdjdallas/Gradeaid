import { ConceptualUnderstanding } from "./ConceptualUnderstanding";
import { TechnicalSkills } from "./TechnicalSkills";

// AnalysisResults/OverallAssessment.jsx
export function OverallAssessment({ assessment }) {
  const safeArrayLength = (arr) => (Array.isArray(arr) ? arr.length : 0);
  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  if (!assessment) return null;

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="font-medium mb-2">Overall Assessment</h4>

      <TechnicalSkills skills={assessment.technicalSkills} />
      <ConceptualUnderstanding
        understanding={assessment.conceptualUnderstanding}
      />

      {safeArrayLength(assessment.majorStrengths) > 0 && (
        <div className="mt-2">
          <strong className="text-sm">Major Strengths:</strong>
          <ul className="mt-1 text-sm list-disc list-inside">
            {safeArray(assessment.majorStrengths).map((strength, idx) => (
              <li key={idx} className="text-green-600 dark:text-green-400">
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {safeArrayLength(assessment.areasForImprovement) > 0 && (
        <div className="mt-2">
          <strong className="text-sm">Areas for Improvement:</strong>
          <ul className="mt-1 text-sm list-disc list-inside">
            {safeArray(assessment.areasForImprovement).map((area, idx) => (
              <li key={idx} className="text-red-600 dark:text-red-400">
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {safeArrayLength(assessment.recommendations) > 0 && (
        <div className="mt-2">
          <strong className="text-sm">Recommendations:</strong>
          <ul className="mt-1 text-sm list-disc list-inside">
            {safeArray(assessment.recommendations).map((rec, idx) => (
              <li key={idx} className="text-blue-600 dark:text-blue-400">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
