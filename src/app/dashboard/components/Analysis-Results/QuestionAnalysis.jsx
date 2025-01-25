// AnalysisResults/QuestionAnalysis.jsx
// AnalysisResults/QuestionAnalysis.jsx
export function QuestionAnalysis({ question, index }) {
  return (
    <div className="border-t pt-4">
      <h5 className="font-medium">Question {question.number || index + 1}</h5>
      <div className="grid gap-4 mt-2">
        <div className="space-y-2">
          <p className="text-sm">
            <strong>Accuracy:</strong>{" "}
            <span
              className={question.accuracy ? "text-green-600" : "text-red-600"}
            >
              {question.accuracy ? "Correct" : "Incorrect"}
            </span>
          </p>

          <div>
            <strong className="text-sm">Process Evaluation:</strong>
            <p className="text-sm mt-1 text-gray-700">
              {question.processEvaluation ||
                "The solution process was not evaluated"}
            </p>
          </div>

          <div>
            <strong className="text-sm">Completeness:</strong>
            <p className="text-sm mt-1 text-gray-700">
              {question.completenessEvaluation ||
                "The solution completeness was not evaluated"}
            </p>
          </div>

          <div>
            <strong className="text-sm">Presentation:</strong>
            <p className="text-sm mt-1 text-gray-700">
              {question.presentationEvaluation ||
                "The solution presentation was not evaluated"}
            </p>
          </div>

          {question.feedback && (
            <div>
              <strong className="text-sm">Feedback:</strong>
              <p className="text-sm mt-1 text-gray-700">{question.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
