import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

const GradeCalculator = ({ analysisResult, subject }) => {
  // Move isMathSubject declaration before the useMemo hook
  const isMathSubject =
    subject?.toLowerCase() === "math" ||
    subject?.toLowerCase() === "mathematics";

  // Normalize any score to ensure it doesn't exceed maxPossible
  const normalizeScore = (score, maxPossible = 100) => {
    const numberScore = Number(score) || 0;
    return Math.min(Math.max(numberScore, 0), maxPossible);
  };

  const calculateOverallGrade = useMemo(() => {
    if (!analysisResult || !analysisResult.overallAssessment) return 0;

    const { technicalSkills, conceptualUnderstanding } =
      analysisResult.overallAssessment;

    // For mathematics, focus purely on accuracy
    if (isMathSubject) {
      const correctQuestions =
        analysisResult.questions?.filter((q) => q.accuracy).length || 0;
      const totalQuestions = analysisResult.questions?.length || 1;
      return normalizeScore(
        Math.round((correctQuestions / totalQuestions) * 100)
      );
    }

    // For other subjects, use weighted criteria
    const weights = {
      technicalSkills: 0.3, // 30% of total grade
      conceptualUnderstanding: 0.3, // 30% of total grade
      questions: 0.4, // 40% of total grade
    };

    // Calculate technical skills score (scale of 0-5 to 0-100)
    const technicalScore = normalizeScore((technicalSkills?.score || 0) * 20);

    // Calculate conceptual understanding score (scale of 0-5 to 0-100)
    const conceptualScore = normalizeScore(
      (conceptualUnderstanding?.score || 0) * 20
    );

    // Calculate questions score
    const questionsScore = normalizeScore(
      (analysisResult.questions?.reduce((acc, question) => {
        return acc + (question.accuracy ? 1 : 0);
      }, 0) /
        (analysisResult.questions?.length || 1)) *
        100
    );

    // Calculate weighted total
    const totalScore =
      technicalScore * weights.technicalSkills +
      conceptualScore * weights.conceptualUnderstanding +
      questionsScore * weights.questions;

    return normalizeScore(Math.round(totalScore));
  }, [analysisResult, subject, isMathSubject]);

  const getGradeLevel = (score) => {
    const normalizedScore = normalizeScore(score);
    if (normalizedScore >= 90) return "A";
    if (normalizedScore >= 80) return "B";
    if (normalizedScore >= 70) return "C";
    if (normalizedScore >= 60) return "D";
    return "F";
  };

  const gradeLevel = getGradeLevel(calculateOverallGrade);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">Overall Grade</h3>
            <p className="text-sm text-muted-foreground">
              {isMathSubject
                ? "Based on answer accuracy"
                : "Based on technical skills, conceptual understanding, and question accuracy"}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-4xl font-bold ${
                calculateOverallGrade >= 70 ? "text-green-600" : "text-red-600"
              }`}
            >
              {calculateOverallGrade}%
            </span>
            <p className="text-xl font-semibold">{gradeLevel}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {isMathSubject ? (
            <div className="flex justify-between text-sm">
              <span>Answer Accuracy (100%)</span>
              <span>
                {normalizeScore(
                  Math.round(
                    ((analysisResult?.questions?.filter((q) => q.accuracy)
                      ?.length || 0) /
                      (analysisResult?.questions?.length || 1)) *
                      100
                  )
                )}
                %
              </span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span>Technical Skills (30%)</span>
                <span>
                  {normalizeScore(
                    Math.round(
                      (analysisResult?.overallAssessment?.technicalSkills
                        ?.score || 0) * 20
                    )
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Conceptual Understanding (30%)</span>
                <span>
                  {normalizeScore(
                    Math.round(
                      (analysisResult?.overallAssessment
                        ?.conceptualUnderstanding?.score || 0) * 20
                    )
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Question Accuracy (40%)</span>
                <span>
                  {normalizeScore(
                    Math.round(
                      ((analysisResult?.questions?.filter((q) => q.accuracy)
                        ?.length || 0) /
                        (analysisResult?.questions?.length || 1)) *
                        100
                    )
                  )}
                  %
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GradeCalculator;
