// app/api/generate-study-guide/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

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

function createStudyGuidePrompt(data) {
  const {
    gradeLevel,
    subject,
    topic,
    learningStyle,
    focusAreas = [],
    preparationTimeWeeks,
    includeExamples = false,
    visualAids = false,
    difficultyLevel = "medium",
    specialNeeds,
  } = data;

  return `You are an experienced ${subject} teacher creating a comprehensive study guide for grade ${gradeLevel} students.

STUDENT CONTEXT:
- Topic: ${topic}
- Learning Style: ${learningStyle}
- Areas Needing Focus: ${focusAreas.join(", ")}
- Preparation Time: ${preparationTimeWeeks} weeks
- Special Learning Needs: ${specialNeeds || "None specified"}
- Visual Learning Aids Required: ${visualAids ? "Yes" : "No"}

STUDY GUIDE REQUIREMENTS:
1. Create a structured study guide that includes:
   - Key Concepts Overview
   - Essential Vocabulary
   - Main Topics Breakdown
   ${visualAids ? "- Visual Concept Maps and Diagrams" : ""}
   - Learning Objectives
   ${includeExamples ? "- Worked Examples with Step-by-Step Solutions" : ""}
   - Practice Problems
   - Study Strategies
   - Self-Assessment Questions

2. Adapt content for ${learningStyle} learning style by:
   - Using appropriate teaching methods
   - Including relevant exercises
   - Providing suitable study techniques

3. Special Considerations:
   - Break down complex topics into manageable chunks
   - Include memory aids and mnemonics where helpful
   - Provide clear progression path through topics

4. Time Management:
   - Structure content for ${preparationTimeWeeks}-week study period
   - Include weekly study plans
   - Suggest time allocation for different topics

5. Practice and Review:
   - Include checkpoint questions
   - Provide progress tracking tools
   - Add review summaries

Difficulty Level: ${difficultyLevel}

Please structure your response with clear section headings for:
1. Key Concepts Overview
2. Essential Vocabulary
3. Main Topics Breakdown
4. Learning Objectives
5. Study Strategies
6. Practice Problems
7. Self-Assessment
8. Weekly Study Plan`;
}

export async function POST(req) {
  try {
    // Get request data
    const data = await req.json();
    console.log("Received data:", data);

    // Validate required fields
    const requiredFields = [
      "gradeLevel",
      "subject",
      "topic",
      "learningStyle",
      "preparationTimeWeeks",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate content using Claude
    console.log("Generating content with Claude...");
    const completion = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4000,
      temperature: 0.7,
      system:
        "You are an experienced educational content developer specializing in creating personalized study guides.",
      messages: [
        {
          role: "user",
          content: createStudyGuidePrompt(data),
        },
      ],
    });

    // Process the response
    const content = completion.content[0].text.trim();
    console.log("Generated content length:", content.length);

    // Structure the content sections
    const sections = {
      overview: extractSection(content, "Key Concepts Overview"),
      vocabulary: extractSection(content, "Essential Vocabulary"),
      mainTopics: extractSection(content, "Main Topics Breakdown"),
      objectives: extractSection(content, "Learning Objectives"),
      examples: data.includeExamples
        ? extractSection(content, "Worked Examples")
        : null,
      practice: extractSection(content, "Practice Problems"),
      strategies: extractSection(content, "Study Strategies"),
      assessment: extractSection(content, "Self-Assessment"),
      weeklyPlan: createWeeklyPlan(data.preparationTimeWeeks, content),
    };

    // Prepare database record
    const studyGuideRecord = {
      grade_level: data.gradeLevel,
      subject: data.subject,
      topic: data.topic,
      content: sections,
      metadata: {
        learningStyle: data.learningStyle,
        focusAreas: data.focusAreas || [],
        preparationTimeWeeks: data.preparationTimeWeeks,
        difficultyLevel: data.difficultyLevel || "medium",
        includesVisualAids: !!data.visualAids,
        specialNeeds: data.specialNeeds || null,
      },
      created_at: new Date().toISOString(),
    };

    console.log("Saving to database...");

    // Save to database
    const { data: savedGuide, error: saveError } = await supabase
      .from("study_guides")
      .insert(studyGuideRecord)
      .select()
      .single();

    if (saveError) {
      console.error("Database save error:", saveError);
      throw new Error(saveError.message);
    }

    console.log("Successfully saved study guide with ID:", savedGuide.id);

    // Return structured response
    return NextResponse.json({
      success: true,
      id: savedGuide.id,
      content: sections,
      metadata: {
        gradeLevel: data.gradeLevel,
        subject: data.subject,
        topic: data.topic,
        learningStyle: data.learningStyle,
        preparationTimeWeeks: data.preparationTimeWeeks,
        difficultyLevel: data.difficultyLevel || "medium",
      },
    });
  } catch (error) {
    console.error("Study guide generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate study guide",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to extract sections from content
function extractSection(content, sectionName) {
  try {
    const sectionRegex = new RegExp(
      `${sectionName}[:\\n]([\\s\\S]*?)(?=\\n\\s*[A-Z][a-zA-Z\\s]*:|$)`
    );
    const match = content.match(sectionRegex);
    return match ? match[1].trim() : null;
  } catch (error) {
    console.error(`Error extracting section ${sectionName}:`, error);
    return null;
  }
}

// Helper function to create weekly study plan
function createWeeklyPlan(weeks, content) {
  try {
    const weeklyPlan = [];
    const weeksNum = parseInt(weeks);

    // Extract the weekly plan section if it exists
    const planSection = extractSection(content, "Weekly Study Plan");
    if (planSection) {
      return planSection;
    }

    // Create a structured weekly plan from the content
    const mainTopics = extractSection(content, "Main Topics Breakdown");
    if (mainTopics) {
      const topics = mainTopics
        .split("\n")
        .filter((t) => t.trim())
        .map((t) => t.replace(/^[-•*]\s*/, "").trim());

      const topicsPerWeek = Math.ceil(topics.length / weeksNum);

      for (let week = 0; week < weeksNum; week++) {
        const weekTopics = topics.slice(
          week * topicsPerWeek,
          (week + 1) * topicsPerWeek
        );
        weeklyPlan.push({
          week: week + 1,
          topics: weekTopics,
          objectives: weekTopics.map(
            (topic) => `Master the concepts of ${topic}`
          ),
          activities: [
            "Review core concepts",
            "Complete practice problems",
            "Self-assessment quiz",
          ],
        });
      }
    }

    return weeklyPlan;
  } catch (error) {
    console.error("Error creating weekly plan:", error);
    return [];
  }
}
