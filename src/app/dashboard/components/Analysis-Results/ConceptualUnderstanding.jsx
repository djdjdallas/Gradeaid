// AnalysisResults/ConceptualUnderstanding.jsx
export function ConceptualUnderstanding({ understanding }) {
  const safeArrayLength = (arr) => (Array.isArray(arr) ? arr.length : 0);
  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  if (!understanding) return null;

  return (
    <div className="mt-4">
      <strong className="text-sm">Conceptual Understanding:</strong>
      <div className="mt-2 ml-4">
        <p className="text-sm">
          <strong>Score:</strong> {understanding.score}/5
        </p>
        {safeArrayLength(understanding.strengths) > 0 && (
          <div className="mt-1">
            <strong className="text-sm">Strengths:</strong>
            <ul className="mt-1 text-sm list-disc list-inside">
              {safeArray(understanding.strengths).map((strength, idx) => (
                <li key={idx} className="text-green-600 dark:text-green-400">
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
        {safeArrayLength(understanding.weaknesses) > 0 && (
          <div className="mt-1">
            <strong className="text-sm">Weaknesses:</strong>
            <ul className="mt-1 text-sm list-disc list-inside">
              {safeArray(understanding.weaknesses).map((weakness, idx) => (
                <li key={idx} className="text-red-600 dark:text-red-400">
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
