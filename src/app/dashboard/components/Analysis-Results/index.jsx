// AnalysisResults/index.jsx
import { QuestionAnalysis } from "./QuestionAnalysis";
import { TechnicalSkills } from "./TechnicalSkills";
import { ConceptualUnderstanding } from "./ConceptualUnderstanding";
import { OverallAssessment } from "./OverallAssessment";
import { AnalysisDashboard } from "./AnalysisDashboard";
import { OriginalProblem } from "./OriginalProblem";

export function AnalysisResults({ result, originalText }) {
  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  if (!result) return null;

  return (
    <div className="space-y-4 mt-6">
      {/* Original Problem Display */}
      <OriginalProblem
        text={originalText || "Original problem text not available"}
      />

      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-4">Analysis Results</h3>

        {/* Overall Score and Summary */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <p className="text-lg">
              <strong>Overall Score:</strong>{" "}
              <span
                className={`${
                  result.overallAssessment?.totalScore >= 70
                    ? "text-green-600"
                    : "text-red-600"
                } font-semibold`}
              >
                {result.overallAssessment?.totalScore || 0}%
              </span>
            </p>
          </div>
          <div>
            <strong>Teacher Summary:</strong>
            <p className="mt-1 text-sm whitespace-pre-wrap p-4 bg-white rounded-md shadow-sm">
              {result.overallAssessment?.teacherSummary ||
                "No summary available"}
            </p>
          </div>
        </div>

        {/* Question Analysis */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Question-by-Question Analysis</h4>
            <span className="text-sm text-muted-foreground">
              {safeArray(result.questions).length} questions analyzed
            </span>
          </div>
          <div className="divide-y divide-gray-200">
            {safeArray(result.questions).map((question, index) => (
              <QuestionAnalysis
                key={index}
                question={question}
                index={index}
                originalText={originalText}
              />
            ))}
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <OverallAssessment assessment={result.overallAssessment} />
        </div>

        {/* Charts and Visualizations */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-medium mb-4">Performance Analytics</h4>
          <AnalysisDashboard analysisData={result} />
        </div>
      </div>
    </div>
  );
}

export {
  QuestionAnalysis,
  TechnicalSkills,
  ConceptualUnderstanding,
  OverallAssessment,
  AnalysisDashboard,
  OriginalProblem,
};
