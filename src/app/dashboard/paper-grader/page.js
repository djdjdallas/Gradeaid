"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Import base components
import { StudentSelect } from "../components/StudentSelect";
import { SubjectSelect } from "../components/SubjectSelect";
import { FileUpload } from "../components/FileUpload";

// Import analysis components
// import {
//   AnalysisResults,
//   QuestionAnalysis,
//   TechnicalSkills,
//   ConceptualUnderstanding,
//   OverallAssessment,
// } from "../components/AnalysisResults";
import { AnalysisResults } from "../components/Analysis-Results";
import { QuestionAnalysis } from "../components/Analysis-Results";
import { TechnicalSkills } from "../components/Analysis-Results";
import { ConceptualUnderstanding } from "../components/Analysis-Results";
import { OverallAssessment } from "../components/Analysis-Results";
import { AnalysisDashboard } from "../components/Analysis-Results/AnalysisDashboard";
import { OriginalProblem } from "../components/Analysis-Results";
// Constants
const ALLOWED_FILE_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "text/plain": "TXT",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function PaperAnalyzerPage() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeData();

    // Cleanup function
    return () => {
      if (file) {
        URL.revokeObjectURL(file);
      }
    };
  }, []);

  async function initializeData() {
    try {
      setLoading(true);
      setError(null);
      console.log("Starting initialization...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        throw new Error(`Authentication failed: ${userError.message}`);
      }

      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Get or create teacher profile
      let teacherData;
      const { data: existingTeacher, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (teacherError && teacherError.code !== "PGRST116") {
        throw new Error(
          `Failed to fetch teacher profile: ${teacherError.message}`
        );
      }

      if (!existingTeacher) {
        const { data: newTeacher, error: createError } = await supabase
          .from("teachers")
          .insert([
            {
              user_id: user.id,
              full_name: user.email?.split("@")[0] || "New Teacher",
              email: user.email,
            },
          ])
          .select()
          .single();

        if (createError) {
          throw new Error(
            `Failed to create teacher profile: ${createError.message}`
          );
        }
        teacherData = newTeacher;
      } else {
        teacherData = existingTeacher;
      }

      setTeacherProfile(teacherData);

      // Fetch students with retry logic
      const { data: studentsData, error: studentsError } =
        await fetchStudentsWithRetry(teacherData.id);

      if (studentsError) {
        throw new Error(`Failed to fetch students: ${studentsError.message}`);
      }

      setStudents(studentsData || []);
    } catch (error) {
      console.error("Initialization error:", error);
      setError(error.message);
      toast.error("Failed to load data", {
        description: error.message || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudentsWithRetry(teacherId, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id, full_name, grade_level, created_at")
          .eq("teacher_id", teacherId)
          .order("full_name");

        if (!error) {
          return { data, error: null };
        }

        if (i === retries - 1) {
          return { data: null, error };
        }

        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      } catch (error) {
        if (i === retries - 1) {
          return { data: null, error };
        }
      }
    }
  }

  async function handleFileUpload(e) {
    try {
      const uploadedFile = e.target.files[0];
      if (!uploadedFile) return;

      if (uploadedFile.size > MAX_FILE_SIZE) {
        throw new Error(
          `File must be smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        );
      }

      if (!ALLOWED_FILE_TYPES[uploadedFile.type]) {
        throw new Error(
          `Please upload a ${Object.values(ALLOWED_FILE_TYPES).join(", ")} file`
        );
      }

      if (file) {
        URL.revokeObjectURL(file);
      }

      setFile(uploadedFile);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Invalid file", { description: error.message });
      e.target.value = "";
      setFile(null);
    }
  }

  async function analyzePaper() {
    if (!validateAnalysis()) return;

    try {
      setAnalyzing(true);
      setError(null);

      // First, read the file content
      const fileText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", studentId);
      formData.append("subject", subject);
      formData.append("teacherId", teacherProfile.id);
      formData.append("originalText", fileText);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || "Analysis failed");
      }

      setResult({ ...responseData, originalText: fileText });
      await saveAnalysisResult(responseData, fileText);

      toast.success("Paper analyzed successfully");
    } catch (error) {
      console.error("Analysis error:", error);
      setError(error.message);
      toast.error("Analysis failed", {
        description: error.message || "Please try again",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveAnalysisResult(analysisResult) {
    if (!analysisResult?.overallAssessment?.totalScore) {
      console.error("Invalid analysis result:", analysisResult);
      return;
    }

    try {
      const { error } = await supabase.from("paper_analyses").insert({
        student_id: studentId,
        teacher_id: teacherProfile.id,
        subject: subject,
        score: analysisResult.overallAssessment.totalScore,
        feedback: analysisResult.overallAssessment.teacherSummary,
        questions_analysis: analysisResult.questions || [],
        overall_assessment: analysisResult.overallAssessment,
        file_name: file.name,
        analyzed_at: new Date().toISOString(),
        meta: {
          conceptCoverage: analysisResult.meta?.conceptCoverage || {},
          difficultyDistribution:
            analysisResult.meta?.difficultyDistribution || {},
          timeSpent: analysisResult.meta?.timeSpent || 0,
          complexityMetrics: analysisResult.meta?.complexityMetrics || {},
        },
        learning_path: {
          shortTerm:
            analysisResult.overallAssessment.learningPath?.shortTerm || [],
          mediumTerm:
            analysisResult.overallAssessment.learningPath?.mediumTerm || [],
          longTerm:
            analysisResult.overallAssessment.learningPath?.longTerm || [],
        },
        skill_gaps: {
          critical: analysisResult.overallAssessment.skillGaps?.critical || [],
          moderate: analysisResult.overallAssessment.skillGaps?.moderate || [],
          minor: analysisResult.overallAssessment.skillGaps?.minor || [],
        },
        concepts_covered: analysisResult.meta?.conceptCoverage || [],
      });

      if (error) throw error;
      console.log("Analysis saved to database");

      // Update student progress
      await updateStudentProgress(analysisResult);
    } catch (error) {
      console.error("Error saving analysis:", error);
      toast.error("Failed to save analysis results", {
        description:
          "The analysis completed but couldn't be saved to your history",
      });
    }
  }

  // Helper function to update student progress
  async function updateStudentProgress(analysisResult) {
    try {
      const progressData = {
        student_id: studentId,
        paper_analysis_id: analysisResult.paperAnalysisId,
        concept_mastery:
          analysisResult.overallAssessment.conceptualUnderstanding
            .keyConceptsMastery,
        skill_progress:
          analysisResult.overallAssessment.technicalSkills.progressIndicators,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("student_progress")
        .insert(progressData);

      if (error) throw error;
      console.log("Student progress updated successfully");
    } catch (error) {
      console.error("Error updating student progress:", error);
      // Don't throw here, just log the error as this is a secondary operation
    }
  }

  function validateAnalysis() {
    if (!file) {
      toast.error("No file selected");
      return false;
    }
    if (!studentId) {
      toast.error("Please select a student");
      return false;
    }
    if (!subject) {
      toast.error("Please select a subject");
      return false;
    }
    if (!teacherProfile) {
      toast.error("Teacher profile not found");
      return false;
    }
    return true;
  }

  // Error UI
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">
            Error Loading Paper Analyzer
          </h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Loading UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Paper Analyzer</CardTitle>
          <CardDescription>
            Upload a paper to analyze and grade it using AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student Selection */}
          <StudentSelect
            students={students}
            studentId={studentId}
            setStudentId={setStudentId}
          />

          {/* Subject Selection */}
          <SubjectSelect subject={subject} setSubject={setSubject} />

          {/* File Upload */}
          <FileUpload onFileUpload={handleFileUpload} analyzing={analyzing} />

          {/* Analysis Button */}
          <div className="flex justify-end">
            <Button
              onClick={analyzePaper}
              disabled={!file || analyzing || !studentId || !subject}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {/* Analysis Results and Dashboard */}
          {result && (
            <div className="space-y-8">
              {/* Traditional Analysis Results */}
              <AnalysisResults
                result={result}
                originalText={result.originalText}
                components={{
                  QuestionAnalysis,
                  TechnicalSkills,
                  ConceptualUnderstanding,
                  OverallAssessment,
                }}
              />

              {/* New Analysis Dashboard */}
              <div className="mt-8">
                <CardHeader>
                  <CardTitle>Analysis Dashboard</CardTitle>
                  <CardDescription>
                    Visual representation of student performance and progress
                  </CardDescription>
                </CardHeader>
                <AnalysisDashboard analysisData={result} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
