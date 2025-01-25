import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create a template for the expected response structure
const responseTemplate = {
  questions: [],
  overallAssessment: {
    totalScore: 0,
    technicalSkills: {
      score: 0,
      strengths: [],
      weaknesses: [],
    },
    conceptualUnderstanding: {
      score: 0,
      strengths: [],
      weaknesses: [],
    },
    majorStrengths: [],
    areasForImprovement: [],
    recommendations: [],
    teacherSummary: "",
  },
};

// Helper function to clean response text
function cleanResponseText(text) {
  return (
    text
      // Remove any markdown code blocks
      .replace(/```json\n?|```\n?/g, "")
      // Remove any non-printable characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
      // Remove any BOM
      .replace(/^\uFEFF/, "")
      // Remove any leading/trailing whitespace
      .trim()
      // Fix escaped quotes
      .replace(/\\"/g, '"')
      // Handle newlines consistently
      .replace(/\r?\n/g, "\\n")
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, "$1")
      // Remove any non-JSON content before or after
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1")
  );
}

async function extractTextFromFile(file) {
  console.log("Attempting to extract text from file:", file.type);
  const fileType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  let text = "";

  try {
    switch (fileType) {
      case "application/pdf":
        console.log("Processing PDF file...");
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(Buffer.from(arrayBuffer));
        text = pdfData.text;
        break;

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        console.log("Processing DOCX file...");
        const result = await mammoth.extractRawText({
          buffer: Buffer.from(arrayBuffer),
        });
        text = result.value;
        break;

      case "text/plain":
        console.log("Processing TXT file...");
        text = new TextDecoder().decode(arrayBuffer);
        break;

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    text = text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
    console.log("Text extraction successful, length:", text.length);
    return text;
  } catch (error) {
    console.error("Error in extractTextFromFile:", error);
    throw new Error(
      `Failed to extract text from ${fileType} file: ${error.message}`
    );
  }
}

async function analyzeWithClaude(text, subject) {
  console.log("Starting Claude analysis for subject:", subject);
  try {
    const maxChunkSize = 12000;
    let analysisText = text;
    if (text.length > maxChunkSize) {
      analysisText =
        text.slice(0, maxChunkSize) + "\n[Content truncated for length]";
    }

    const mathSpecificPrompt = `You are an experienced ${subject} teacher grading a student's assignment. Analyze each question and provide detailed feedback.

Here's the student's assignment:
${analysisText}

Provide a detailed analysis focusing on:
1. Technical accuracy (correctness, calculations, notation)
2. Mathematical process (logic, method selection, reasoning)
3. Completeness (steps shown, explanations, justifications)
4. Presentation (organization, readability, notation)

Return ONLY a valid JSON object with NO markdown or formatting.

Use this EXACT structure (do not deviate or add fields):
${JSON.stringify(responseTemplate, null, 2)}`;

    const completion = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content:
            mathSpecificPrompt +
            '\n\nIMPORTANT: Your response must be ONLY a valid JSON object. Do not include any text, markdown, or formatting before or after the JSON. The response should start with "{" and end with "}".',
        },
      ],
      temperature: 0.1,
      system:
        "You are a mathematics teacher. Respond with ONLY valid JSON matching the exact structure provided. Do not include any additional text or formatting.",
    });

    let responseText = completion.content[0].text.trim();

    // Debug logs
    console.log("Response text before cleaning:", responseText);
    console.log("First 100 characters:", responseText.slice(0, 100));
    console.log("Response text length:", responseText.length);
    console.log(
      "Character codes of first 10 characters:",
      Array.from(responseText.slice(0, 10)).map((c) => c.charCodeAt(0))
    );

    // Clean the response text
    responseText = cleanResponseText(responseText);

    // Validate basic JSON structure
    if (!responseText.startsWith("{") || !responseText.endsWith("}")) {
      console.error("Invalid JSON structure:", responseText);
      return responseTemplate;
    }

    try {
      // First attempt with regular parsing
      const result = JSON.parse(responseText);
      return result;
    } catch (firstError) {
      console.error("First parse attempt failed:", firstError);
      try {
        // Try to extract just the JSON object
        const match = responseText.match(/{[\s\S]*}/);
        if (match) {
          const extractedJson = match[0];
          console.log("Extracted JSON:", extractedJson);
          const result = JSON.parse(extractedJson);
          return result;
        }
      } catch (secondError) {
        console.error("Second parse attempt failed:", secondError);
      }

      console.error("All parsing attempts failed. Returning template.");
      return responseTemplate;
    }
  } catch (error) {
    console.error("Error in analyzeWithClaude:", error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

export async function POST(req) {
  console.log("Received POST request to /api/analyze");

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const studentId = formData.get("studentId");
    const subject = formData.get("subject");
    const teacherId = formData.get("teacherId");

    // Log received data
    console.log("Received analysis request:", {
      fileName: file?.name,
      studentId,
      subject,
      teacherId,
    });

    // Validate inputs
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

    // Extract text from file
    console.log("Extracting text from file...");
    const text = await extractTextFromFile(file);

    if (!text || text.trim().length === 0) {
      throw new Error("No text content could be extracted from the file");
    }

    // Analyze with Claude
    console.log("Starting analysis with Claude...");
    const analysisResult = await analyzeWithClaude(text, subject);

    // Save to database
    console.log("Saving analysis results to database...");
    const { data: paperData, error: paperError } = await supabase
      .from("paper_analyses")
      .insert({
        student_id: studentId,
        teacher_id: teacherId,
        subject: subject,
        score: analysisResult.overallAssessment.totalScore,
        feedback: analysisResult.overallAssessment.teacherSummary,
        questions_analysis: analysisResult.questions,
        overall_assessment: analysisResult.overallAssessment,
        file_name: file.name,
        analyzed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paperError) {
      console.error("Database error:", paperError);
      throw paperError;
    }

    console.log("Analysis completed successfully");

    return NextResponse.json({
      success: true,
      ...analysisResult,
      paperAnalysisId: paperData.id,
    });
  } catch (error) {
    console.error("Analysis process error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
