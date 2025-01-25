// AnalysisResults/index.jsx
import { QuestionAnalysis } from "./QuestionAnalysis";
import { TechnicalSkills } from "./TechnicalSkills";
import { ConceptualUnderstanding } from "./ConceptualUnderstanding";
import { OverallAssessment } from "./OverallAssessment";
import { AnalysisDashboard } from "./AnalysisDashboard";
export function AnalysisResults({ result }) {
  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  if (!result) return null;

  return (
    <div className="space-y-4 mt-6">
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-4">Analysis Results</h3>

        {/* Overall Score and Summary */}
        <div className="space-y-4 mb-6">
          <p>
            <strong>Overall Score:</strong>{" "}
            {result.overallAssessment?.totalScore || 0}%
          </p>
          <div>
            <strong>Teacher Summary:</strong>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {result.overallAssessment?.teacherSummary ||
                "No summary available"}
            </p>
          </div>
        </div>

        {/* Question Analysis */}
        <div className="space-y-6">
          <h4 className="font-medium">Question-by-Question Analysis</h4>
          {safeArray(result.questions).map((question, index) => (
            <QuestionAnalysis key={index} question={question} index={index} />
          ))}
        </div>

        {/* Overall Assessment */}
        <OverallAssessment assessment={result.overallAssessment} />
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
};
