// AnalysisResults/QuestionAnalysis.jsx
export function QuestionAnalysis({ question, index }) {
  return (
    <div className="border-t pt-4">
      <h5 className="font-medium">Question {question.number || index + 1}</h5>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <p className="text-sm">
            <strong>Accuracy:</strong>{" "}
            <span
              className={question.accuracy ? "text-green-600" : "text-red-600"}
            >
              {question.accuracy ? "Correct" : "Incorrect"}
            </span>
          </p>
          <div className="mt-2">
            <strong className="text-sm">Process Evaluation:</strong>
            <p className="text-sm">
              {question.processEvaluation || "Not evaluated"}
            </p>
          </div>
          <div className="mt-2">
            <strong className="text-sm">Completeness:</strong>
            <p className="text-sm">
              {question.completenessEvaluation || "Not evaluated"}
            </p>
          </div>
        </div>
        <div>
          <div>
            <strong className="text-sm">Presentation:</strong>
            <p className="text-sm">
              {question.presentationEvaluation || "Not evaluated"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
