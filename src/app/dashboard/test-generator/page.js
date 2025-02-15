"use client";
import { useState, useEffect } from "react";
import { useTestGenerator } from "@/hooks/use-test-generator";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FilePlus, Book, FileText, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { StudyGuideForm } from "./StudyGuideForm";

export default function TestGeneratorPage() {
  const router = useRouter();
  const { generateTest, loading: generationLoading } = useTestGenerator();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // Add the subjects array
  const subjects = [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Geography",
    "Physics",
    "Chemistry",
    "Biology",
  ];

  // Add the questionTypes object
  const questionTypes = {
    mathematics: [
      "Multiple Choice",
      "Short Answer",
      "Problem Solving",
      "Word Problems",
    ],
    science: [
      "Multiple Choice",
      "True/False",
      "Lab Questions",
      "Diagram Analysis",
    ],
    english: ["Essay", "Reading Comprehension", "Grammar", "Vocabulary"],
    default: ["Multiple Choice", "True/False", "Short Answer"],
  };

  const [formData, setFormData] = useState({
    gradeLevel: "",
    subject: "",
    topic: "",
    difficulty: "medium",
    testType: "quiz",
    questionCount: 10,
    timeLimit: 30,
    includeAnswerKey: true,
    questionTypes: [],
  });
  const [generatedContent, setGeneratedContent] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) {
        router.push("/login");
        return;
      }
      setLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData.testType === "study-guide") {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/generate-study-guide", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate study guide");
        }

        const data = await response.json();
        setGeneratedContent(data);
      } else {
        // Use test generator hook for quizzes and tests
        const result = await generateTest({
          ...formData,
          // Add any additional metadata needed
          timestamp: new Date().toISOString(),
        });
        setGeneratedContent(result);
      }

      toast.success(
        `${
          formData.testType === "study-guide" ? "Study guide" : "Test"
        } generated successfully!`
      );
      setStep(3);
    } catch (error) {
      console.error("Generation error:", error);
      if (error.message.includes("sign in")) {
        router.push("/login");
        return;
      }
      toast.error("Failed to generate content", {
        description: error.message,
      });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Choose Content Type</Label>
        <RadioGroup
          value={formData.testType}
          onValueChange={(value) =>
            setFormData({ ...formData, testType: value })
          }
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="quiz" id="quiz" />
            <Label htmlFor="quiz">Quiz</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="test" id="test" />
            <Label htmlFor="test">Full Test</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="study-guide" id="study-guide" />
            <Label htmlFor="study-guide">Study Guide</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Grade Level</Label>
        <Input
          type="number"
          min="1"
          max="12"
          placeholder="Enter grade level (1-12)"
          value={formData.gradeLevel}
          onChange={(e) =>
            setFormData({ ...formData, gradeLevel: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Subject</Label>
        <Select
          value={formData.subject}
          onValueChange={(value) =>
            setFormData({ ...formData, subject: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject.toLowerCase()}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Topic/Unit</Label>
        <Input
          placeholder="Enter specific topic or unit"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
        />
      </div>

      <Button
        className="w-full"
        onClick={() => setStep(2)}
        disabled={!formData.gradeLevel || !formData.subject || !formData.topic}
      >
        Next
      </Button>
    </div>
  );

  const renderStep2 = () => {
    // If study guide is selected, show the specialized form
    if (formData.testType === "study-guide") {
      return (
        <StudyGuideForm
          onComplete={(result) => {
            setGeneratedContent(result);
            setStep(3);
          }}
          initialData={{
            gradeLevel: formData.gradeLevel,
            subject: formData.subject,
            topic: formData.topic,
          }}
        />
      );
    }

    // Regular test/quiz configuration
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Difficulty Level</Label>
          <RadioGroup
            value={formData.difficulty}
            onValueChange={(value) =>
              setFormData({ ...formData, difficulty: value })
            }
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="easy" id="easy" />
              <Label htmlFor="easy">Easy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hard" id="hard" />
              <Label htmlFor="hard">Hard</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Question Types</Label>
          <div className="grid gap-2">
            {(questionTypes[formData.subject] || questionTypes.default).map(
              (type) => (
                <div key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={type}
                    checked={formData.questionTypes.includes(type)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...formData.questionTypes, type]
                        : formData.questionTypes.filter((t) => t !== type);
                      setFormData({ ...formData, questionTypes: newTypes });
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={type}>{type}</Label>
                </div>
              )
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Number of Questions: {formData.questionCount}</Label>
          <Slider
            value={[formData.questionCount]}
            onValueChange={(value) =>
              setFormData({ ...formData, questionCount: value[0] })
            }
            min={5}
            max={50}
            step={5}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Time Limit (minutes): {formData.timeLimit}</Label>
          <Slider
            value={[formData.timeLimit]}
            onValueChange={(value) =>
              setFormData({ ...formData, timeLimit: value[0] })
            }
            min={5}
            max={120}
            step={5}
            className="w-full"
          />
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={loading || formData.questionTypes.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FilePlus className="mr-2 h-4 w-4" />
                Generate {formData.testType}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      {generatedContent && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Study Guide/Test Content Card */}
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {formData.testType === "study-guide"
                    ? "Study Guide"
                    : "Test Content"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto pr-4">
                  {formData.testType === "study-guide" ? (
                    <div className="space-y-6">
                      {Object.entries(generatedContent.content).map(
                        ([section, content]) =>
                          content &&
                          section !== "weeklyPlan" && (
                            <div key={section} className="space-y-2">
                              <h4 className="text-lg font-medium sticky top-0 bg-white py-2 capitalize">
                                {section.replace(/([A-Z])/g, " $1").trim()}
                              </h4>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {content}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm">
                      {generatedContent.content}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Answer Key Card */}
            {formData.testType !== "study-guide" &&
              formData.includeAnswerKey && (
                <Card className="h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Book className="h-5 w-5" />
                      Answer Key
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto pr-4">
                      <pre className="whitespace-pre-wrap text-sm">
                        {generatedContent.answerKey}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Weekly Study Plan Card */}
            {formData.testType === "study-guide" && (
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    Weekly Study Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto pr-4">
                    <div className="space-y-6">
                      {typeof generatedContent.content.weeklyPlan ===
                      "string" ? (
                        <pre className="whitespace-pre-wrap text-sm">
                          {generatedContent.content.weeklyPlan}
                        </pre>
                      ) : (
                        generatedContent.content.weeklyPlan?.map((week) => (
                          <div key={week.week} className="space-y-3">
                            <h5 className="text-lg font-medium sticky top-0 bg-white py-2">
                              Week {week.week}
                            </h5>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                              {week.topics.map((topic, i) => (
                                <li key={i} className="text-muted-foreground">
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setGeneratedContent(null);
                setFormData({
                  gradeLevel: "",
                  subject: "",
                  topic: "",
                  difficulty: "medium",
                  testType: "quiz",
                  questionCount: 10,
                  timeLimit: 30,
                  includeAnswerKey: true,
                  questionTypes: [],
                });
              }}
            >
              Create New
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                // Download logic here
                toast.success("Download started");
              }}
            >
              Download
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-3xl font-bold tracking-tight">Content Generator</h2>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1
              ? "Basic Information"
              : step === 2
              ? "Content Configuration"
              : "Generated Content"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter the basic details about your content"
              : step === 2
              ? "Configure the content parameters"
              : "Review and download your generated content"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1
            ? renderStep1()
            : step === 2
            ? renderStep2()
            : renderStep3()}
        </CardContent>
      </Card>
    </div>
  );
}
