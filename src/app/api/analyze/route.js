import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeWithClaude } from "@/lib/analysis/service";
import { extractTextFromFile } from "@/lib/fileProcessing";
import { calculateScore } from "@/lib/grading";

// Initialize Supabase admin client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

/**
 * Validates and retrieves teacher profile and trial status
 */
async function validateTeacherAndTrial(userId) {
  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (teacherError || !teacher) {
    throw new Error("Teacher profile not found");
  }

  // Check subscription status
  if (teacher.subscription_status === "active") {
    return teacher; // Paid users can analyze unlimited papers
  }

  // For trial users, check paper count
  if (teacher.subscription_status === "trialing") {
    const { count, error: countError } = await supabase
      .from("paper_analyses")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacher.id);

    if (countError) {
      throw new Error("Failed to check paper analysis count");
    }

    if (count >= 5) {
      throw new Error(
        "Trial limit reached (5 papers). Please upgrade to continue analyzing papers."
      );
    }
  } else {
    throw new Error("No active subscription or trial found");
  }

  return teacher;
}

/**
 * Saves analysis results to database
 */
async function saveResults(analysisData, userId) {
  const { data: paperData, error: paperError } = await supabase
    .from("paper_analyses")
    .insert(analysisData)
    .select()
    .single();

  if (paperError) throw paperError;

  return paperData;
}

export async function POST(req) {
  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing authentication token" },
        { status: 401 }
      );
    }

    // Get and validate token
    const token = authHeader.split(" ")[1];
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate trial status and paper count
    const teacher = await validateTeacherAndTrial(user.id);

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file");
    const studentId = formData.get("studentId");
    const subject = formData.get("subject");
    const teacherId = formData.get("teacherId");

    // Validate form data
    if (!file || !studentId || !subject || !teacherId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: {
            file: !file ? "missing" : "present",
            studentId: !studentId ? "missing" : "present",
            subject: !subject ? "missing" : "present",
            teacherId: !teacherId ? "missing" : "present",
          },
        },
        { status: 400 }
      );
    }

    // Validate teacher ID matches
    if (teacherId !== teacher.id) {
      return NextResponse.json(
        { success: false, error: "Invalid teacher ID" },
        { status: 403 }
      );
    }

    // Extract and analyze text
    console.log("Processing file...");
    const text = await extractTextFromFile(file);

    console.log("Analyzing with Claude...");
    const analysisResult = await analyzeWithClaude(text, subject);

    // Calculate final score
    console.log("Calculating score...");
    const calculatedScore = calculateScore(analysisResult, subject);

    // Prepare final result
    const finalAnalysisResult = {
      ...analysisResult,
      subject,
      overallAssessment: {
        ...analysisResult.overallAssessment,
        totalScore: calculatedScore,
        gradingMethod: subject.toLowerCase().includes("math")
          ? "accuracy_only"
          : "weighted_criteria",
      },
    };

    // Prepare database record
    const analysisData = {
      student_id: studentId,
      teacher_id: teacherId,
      subject: subject,
      score: calculatedScore,
      grading_method: finalAnalysisResult.overallAssessment.gradingMethod,
      feedback: finalAnalysisResult.overallAssessment.teacherSummary,
      questions_analysis: finalAnalysisResult.questions || [],
      overall_assessment: finalAnalysisResult.overallAssessment,
      file_name: file.name,
      analyzed_at: new Date().toISOString(),
      meta: finalAnalysisResult.meta || {},
      learning_path: finalAnalysisResult.overallAssessment.learningPath || {},
      skill_gaps: finalAnalysisResult.overallAssessment.skillGaps || {},
      concepts_covered: finalAnalysisResult.meta?.conceptCoverage || [],
      original_text: text,
    };

    // Save to database
    console.log("Saving results...");
    const paperData = await saveResults(analysisData, user.id);

    // Save student progress
    await supabase.from("student_progress").insert({
      student_id: studentId,
      paper_analysis_id: paperData.id,
      concept_mastery:
        finalAnalysisResult.overallAssessment.conceptualUnderstanding
          ?.keyConceptsMastery || {},
      skill_progress:
        finalAnalysisResult.overallAssessment.technicalSkills
          ?.progressIndicators || {},
      created_at: new Date().toISOString(),
    });

    // Return success response
    console.log("Analysis complete!");
    return NextResponse.json({
      success: true,
      ...finalAnalysisResult,
      paperAnalysisId: paperData.id,
      originalText: text,
    });
  } catch (error) {
    console.error("Analysis process error:", error);

    const statusCode =
      {
        "Trial limit reached (5 papers). Please upgrade to continue analyzing papers.": 403,
        "Authentication required": 401,
        "Teacher profile not found": 404,
        "No active subscription or trial found": 403,
        "Missing required fields": 400,
      }[error.message] || 500;

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: statusCode }
    );
  }
}
