import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function GettingStartedPage() {
  const sections = [
    {
      title: "1. Setting Up Your Account",
      steps: [
        "Complete your teacher profile with basic information",
        "Set up your grading preferences in Settings",
        "Configure notification preferences for assignment submissions",
      ],
    },
    {
      title: "2. Adding Your Students",
      steps: [
        "Navigate to the Students page",
        "Click 'Add Student' to add students individually",
        "Use bulk import for adding multiple students",
        "Organize students by grade level and class",
      ],
    },
    {
      title: "3. Grading Your First Assignment",
      steps: [
        "Go to the Paper Analyzer page",
        "Select a student and subject",
        "Upload the assignment file (PDF, DOCX, or TXT)",
        "Review and adjust AI-generated grades if needed",
        "Save and publish the grades",
      ],
    },
    {
      title: "4. Using the Dashboard",
      steps: [
        "Monitor overall class performance",
        "Track individual student progress",
        "View grading analytics and insights",
        "Generate performance reports",
      ],
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/help">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Help
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">
          Getting Started Guide
        </h2>
      </div>

      <div className="max-w-4xl">
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {section.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/help/tutorials">
            <Button>View Video Tutorials</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
