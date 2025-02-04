"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  MessageSquare,
  Book,
  Mail,
  Send,
  Bug,
  Lightbulb,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
export default function HelpPage() {
  const [feedbackType, setFeedbackType] = useState("general");
  const [feedback, setFeedback] = useState({
    title: "",
    description: "",
    email: "",
  });

  // FAQ data
  const faqs = [
    {
      question: "How do I grade my first paper?",
      answer:
        "To grade your first paper, go to the Paper Analyzer page and follow these steps:\n1. Select a student from the dropdown\n2. Choose the subject\n3. Upload the paper file (PDF, DOCX, or TXT)\n4. Click 'Analyze' to start the grading process",
    },
    {
      question: "What file types are supported?",
      answer:
        "Currently, we support the following file formats:\n- PDF (.pdf)\n- Microsoft Word (.docx)\n- Plain Text (.txt)\nFiles must be under 10MB in size.",
    },
    {
      question: "How is the AI grading calculated?",
      answer:
        "Our AI system analyzes papers based on multiple criteria including technical accuracy, conceptual understanding, and presentation. The final grade is a weighted combination of these factors, customized for each subject.",
    },
    {
      question: "Can I modify the AI's grade?",
      answer:
        "Yes! While the AI provides an initial grade, you can always review and adjust the scores and feedback before finalizing them. Your expertise remains central to the grading process.",
    },
    {
      question: "How do I add students to my class?",
      answer:
        "Navigate to the Students page from the dashboard. Click the 'Add Student' button and fill in the required information. You can add students individually or import them in bulk.",
    },
  ];

  const resources = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of using GradeAid",
      link: "/dashboard/help/getting-started",
      icon: Book,
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides for all features",
      link: "/dashboard/help/tutorials",
      icon: HelpCircle,
    },
    {
      title: "Email Support",
      description: "Contact our support team directly",
      link: "#feedback-form",
      icon: Mail,
    },
  ];

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (!feedback.title || !feedback.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    // TODO: Implement actual feedback submission
    toast.success("Thank you for your feedback!", {
      description:
        "We'll review your submission and get back to you if needed.",
    });

    // Reset form
    setFeedback({
      title: "",
      description: "",
      email: "",
    });
    setFeedbackType("general");
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>

      {/* Resources Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <resource.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{resource.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{resource.description}</p>
              {resource.link.startsWith("#") ? (
                <Button
                  variant="link"
                  className="mt-2 p-0"
                  onClick={() => {
                    const element = document.querySelector(resource.link);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  Contact support →
                </Button>
              ) : (
                <Button variant="link" className="mt-2 p-0" asChild>
                  <Link href={resource.link}>Learn more →</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card id="feedback-form">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent className="whitespace-pre-line">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submit Feedback
          </CardTitle>
          <CardDescription>
            Help us improve GradeAid by sharing your thoughts and suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitFeedback} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Feedback Type</Label>
                <RadioGroup
                  value={feedbackType}
                  onValueChange={setFeedbackType}
                  className="flex flex-col space-y-1 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="general" />
                    <Label
                      htmlFor="general"
                      className="flex items-center gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      General Feedback
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bug" id="bug" />
                    <Label htmlFor="bug" className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Bug Report
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feature" id="feature" />
                    <Label
                      htmlFor="feature"
                      className="flex items-center gap-2"
                    >
                      <Lightbulb className="h-4 w-4" />
                      Feature Request
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of your feedback"
                  value={feedback.title}
                  onChange={(e) =>
                    setFeedback({ ...feedback, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed feedback..."
                  value={feedback.description}
                  onChange={(e) =>
                    setFeedback({ ...feedback, description: e.target.value })
                  }
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email for follow-up"
                  value={feedback.email}
                  onChange={(e) =>
                    setFeedback({ ...feedback, email: e.target.value })
                  }
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
