// app/api/generate-test/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Supabase admin client
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

function createPrompt(data) {
  const {
    gradeLevel,
    subject,
    topic,
    difficulty,
    testType,
    questionCount,
    timeLimit,
    questionTypes = [],
  } = data;

  let prompt = `You are an experienced ${subject} teacher creating a ${testType} for grade ${gradeLevel} students.
Topic: ${topic}
Difficulty Level: ${difficulty}
Number of Questions: ${questionCount}
Time Limit: ${timeLimit} minutes
Question Types: ${questionTypes.join(", ") || "mixed"}

Requirements:
1. Create age-appropriate content for grade ${gradeLevel}
2. Maintain consistent difficulty level (${difficulty})
3. Include a mix of the specified question types
4. Provide clear instructions and point values for each question
5. Include an answer key with explanations
6. Format the output with clear section breaks
7. Ensure questions gradually increase in difficulty
8. Include appropriate scaffolding for harder questions

Format your response as follows:
TEST CONTENT
[Instructions and point values here]

[Questions here with clear numbering and sections]

ANSWER KEY
[Detailed answers and explanations here]

Remember to:
- Use clear, concise language
- Include point values for each question
- Provide detailed explanations in the answer key
- Match the content to the grade level
- Maintain appropriate difficulty throughout`;

  return prompt;
}

export async function POST(req) {
  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Authentication required",
          details: "No authorization header",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const supabaseAuth = createClient(
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
    } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", details: authError?.message },
        { status: 401 }
      );
    }

    // Get request data
    const data = await req.json();

    // Validate required fields
    const requiredFields = [
      "gradeLevel",
      "subject",
      "topic",
      "difficulty",
      "testType",
      "questionCount",
      "timeLimit",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate content using Claude
    const completion = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4000,
      temperature: 0.7,
      system:
        "You are an experienced teacher with deep knowledge of curriculum development and assessment design.",
      messages: [
        {
          role: "user",
          content: createPrompt(data),
        },
      ],
    });

    // Process and format the response
    let content = completion.content[0].text.trim();
    let answerKey = "";

    // Split content and answer key if present
    if (content.includes("ANSWER KEY")) {
      [content, answerKey] = content.split("ANSWER KEY");
    }

    // Save to database
    const { data: savedTest, error: saveError } = await supabase
      .from("generated_tests")
      .insert({
        user_id: user.id,
        grade_level: data.gradeLevel,
        subject: data.subject,
        topic: data.topic,
        test_type: data.testType,
        content: content.trim(),
        answer_key: answerKey.trim(),
        metadata: {
          difficulty: data.difficulty,
          questionCount: data.questionCount,
          timeLimit: data.timeLimit,
          questionTypes: data.questionTypes,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving test:", saveError);
      return NextResponse.json(
        { error: "Failed to save generated test" },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      id: savedTest.id,
      content: content.trim(),
      answerKey: answerKey.trim(),
      metadata: {
        gradeLevel: data.gradeLevel,
        subject: data.subject,
        topic: data.topic,
        testType: data.testType,
        difficulty: data.difficulty,
        questionCount: data.questionCount,
        timeLimit: data.timeLimit,
        questionTypes: data.questionTypes,
      },
    });
  } catch (error) {
    console.error("Test generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate test",
      },
      { status: 500 }
    );
  }
}
