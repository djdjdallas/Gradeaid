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
import { useRouter } from "next/navigation";
// Import base components
import { StudentSelect } from "../components/StudentSelect";
import { SubjectSelect } from "../components/SubjectSelect";
import { FileUpload } from "../components/FileUpload";

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
    const checkAuthAndInitialize = async () => {
      try {
        setLoading(true);

        // Check authentication first
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        if (authError || !session) {
          window.location.href = "/login";
          return;
        }

        // If authenticated, proceed with initialization
        await initializeData();
      } catch (error) {
        console.error("Initialization error:", error);
        setError(error.message);
        toast.error("Failed to load data", {
          description: error.message || "Please try again later",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndInitialize();

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

      // Get fresh session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        console.error("Session error:", sessionError);
        throw new Error("Please sign in to analyze papers");
      }

      // Log analysis attempt
      console.log("Starting paper analysis:", {
        studentId,
        subject,
        fileName: file?.name,
        teacherId: teacherProfile?.id,
      });

      // Read the file content
      const fileText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => {
          console.error("File read error:", e);
          reject(new Error("Failed to read file"));
        };
        reader.readAsText(file);
      });

      // Create form data with logging
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", studentId);
      formData.append("subject", subject);
      formData.append("teacherId", teacherProfile.id);
      formData.append("originalText", fileText);

      console.log("Sending analysis request with data:", {
        fileName: file.name,
        fileSize: file.size,
        studentId,
        subject,
        teacherId: teacherProfile.id,
        textLength: fileText.length,
      });

      // Make request to API route with fresh token
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      // Handle non-200 responses
      if (!response.ok) {
        console.error("API error response:", {
          status: response.status,
          statusText: response.statusText,
          data,
        });

        // Handle specific error cases
        if (response.status === 401) {
          await supabase.auth.signOut();
          window.location.href = "/login";
          throw new Error("Authentication expired. Please sign in again.");
        }

        if (response.status === 413) {
          throw new Error("File too large. Please upload a smaller file.");
        }

        if (response.status === 429) {
          throw new Error("Too many requests. Please try again later.");
        }

        throw new Error(
          data.error || `Analysis failed: ${response.statusText}`
        );
      }

      // Validate API response
      if (!data?.overallAssessment?.totalScore) {
        console.error("Invalid API response:", data);
        throw new Error("Invalid analysis result from API");
      }

      // Log successful analysis
      console.log("Analysis completed successfully:", {
        paperAnalysisId: data.paperAnalysisId,
        score: data.overallAssessment.totalScore,
        questionCount: data.questions?.length,
      });

      // Set result and update UI
      setResult({
        ...data,
        originalText: fileText,
        subject: subject,
      });

      // Save analysis result if API provided an ID
      if (data.paperAnalysisId) {
        try {
          await saveAnalysisResult(data);
          toast.success("Paper analyzed and saved successfully");
        } catch (saveError) {
          console.error("Save error:", saveError);
          toast.error("Analysis complete but failed to save results", {
            description: "Your analysis results weren't saved to your history.",
          });
        }
      } else {
        toast.success("Paper analyzed successfully");
      }
    } catch (error) {
      console.error("Analysis error:", {
        error,
        message: error.message,
        stack: error.stack,
        context: {
          studentId,
          subject,
          fileName: file?.name,
          teacherId: teacherProfile?.id,
        },
      });

      setError(error.message);

      // Handle specific error types
      if (error.message.includes("sign in")) {
        toast.error("Authentication Required", {
          description: error.message,
          action: {
            label: "Sign In",
            onClick: () => (window.location.href = "/login"),
          },
        });
      } else if (error.message.includes("File too large")) {
        toast.error("File Size Error", {
          description: `Maximum file size is ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
        });
      } else if (error.message.includes("Invalid analysis")) {
        toast.error("Analysis Error", {
          description: "Failed to process the paper. Please try again.",
        });
      } else {
        toast.error("Analysis failed", {
          description: error.message || "An unexpected error occurred",
        });
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveAnalysisResult(analysisResult) {
    try {
      // Validate the analysis result first
      if (!analysisResult?.overallAssessment?.totalScore) {
        console.error(
          "Invalid analysis result:",
          JSON.stringify(analysisResult, null, 2)
        );
        throw new Error("Invalid analysis result: Missing required fields");
      }

      // Log the data being sent
      console.log("Saving analysis with data:", {
        student_id: studentId,
        teacher_id: teacherProfile.id,
        subject: subject,
        score: analysisResult.overallAssessment.totalScore,
      });

      const { data, error } = await supabase.from("paper_analyses").insert({
        student_id: studentId,
        teacher_id: teacherProfile.id,
        subject: subject,
        score: analysisResult.overallAssessment.totalScore,
        grading_method:
          subject.toLowerCase() === "math" ||
          subject.toLowerCase() === "mathematics"
            ? "accuracy_only"
            : "weighted_criteria",
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
        grading_details: {
          method:
            subject.toLowerCase() === "math" ||
            subject.toLowerCase() === "mathematics"
              ? {
                  type: "accuracy_only",
                  accuracy_score:
                    ((analysisResult.questions?.filter((q) => q.accuracy)
                      .length || 0) /
                      (analysisResult.questions?.length || 1)) *
                    100,
                }
              : {
                  type: "weighted_criteria",
                  technical_score:
                    (analysisResult.overallAssessment?.technicalSkills?.score ||
                      0) * 20,
                  conceptual_score:
                    (analysisResult.overallAssessment?.conceptualUnderstanding
                      ?.score || 0) * 20,
                  accuracy_score:
                    ((analysisResult.questions?.filter((q) => q.accuracy)
                      .length || 0) /
                      (analysisResult.questions?.length || 1)) *
                    100,
                },
        },
      });

      if (error) {
        console.error("Supabase error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("Analysis saved successfully:", data);
      await updateStudentProgress(analysisResult);
    } catch (error) {
      // Log detailed error information
      console.error("Analysis save error:", {
        error,
        message: error.message,
        stack: error.stack,
        analysisResult: JSON.stringify(analysisResult, null, 2),
      });

      // Re-throw with more context
      throw new Error(`Failed to save analysis: ${error.message}`);
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
            ?.keyConceptsMastery || {},
        skill_progress:
          analysisResult.overallAssessment.technicalSkills
            ?.progressIndicators || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(), // Add this field
      };

      const { error } = await supabase
        .from("student_progress")
        .upsert(progressData, {
          onConflict: "student_id,paper_analysis_id",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error("Error updating student progress:", error);
      } else {
        console.log("Student progress updated successfully");
      }
    } catch (error) {
      console.error("Error in updateStudentProgress:", error);
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

  function TrialUsageIndicator({ teacherId }) {
    const [usedAnalyses, setUsedAnalyses] = useState(0);
    const router = useRouter(); // Add this import at the top of the file

    useEffect(() => {
      async function fetchUsage() {
        const { count } = await supabase
          .from("paper_analyses")
          .select("id", { count: "exact", head: true })
          .eq("teacher_id", teacherId);

        setUsedAnalyses(count || 0);
      }

      fetchUsage();
    }, [teacherId]);

    return (
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Trial usage: {usedAnalyses}/5 papers analyzed
        </div>
        {usedAnalyses >= 5 ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">Trial limit reached</p>
            <p className="text-sm text-blue-600 mt-1 mb-3">
              Upgrade to continue analyzing papers and unlock all features.
            </p>
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View Pricing Plans
            </Button>
          </div>
        ) : usedAnalyses >= 4 ? (
          <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800">
              <span className="font-medium">
                Only {5 - usedAnalyses} analysis remaining
              </span>
              <br />
              <span className="text-sm">
                Consider upgrading to continue using GradeAid
              </span>
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/pricing")}
              className="ml-4"
            >
              View Plans
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-3xl font-bold tracking-tight">Paper Analyzer</h2>

      <Card>
        <CardHeader>
          <CardTitle>Paper Analyzer</CardTitle>
          <CardDescription>
            Upload a paper to analyze and grade it using AI assistance
          </CardDescription>
          {teacherProfile?.subscription_status === "trialing" && (
            <TrialUsageIndicator teacherId={teacherProfile.id} />
          )}
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
                result={{
                  ...result,
                  subject: subject, // Ensure subject is passed
                }}
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
