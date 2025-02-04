import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function TutorialsPage() {
  const tutorials = [
    {
      title: "Getting Started with GradeAid",
      description: "Learn the basics of using GradeAid for your classroom",
      duration: "5:30",
      thumbnail: "/video.jpg",
      category: "Basics",
    },
    {
      title: "AI-Powered Grading Tutorial",
      description: "How to use our AI grading system effectively",
      duration: "8:45",
      thumbnail: "/video.jpg",
      category: "Grading",
    },
    {
      title: "Managing Your Students",
      description: "Tips for organizing and managing student records",
      duration: "6:15",
      thumbnail: "/video.jpg",
      category: "Management",
    },
    {
      title: "Understanding Analytics",
      description: "Deep dive into GradeAid's analytics features",
      duration: "7:20",
      thumbnail: "/video.jpg",
      category: "Analytics",
    },
    {
      title: "Advanced Grading Features",
      description: "Master advanced grading techniques and customization",
      duration: "10:00",
      thumbnail: "/video.jpg",
      category: "Advanced",
    },
    {
      title: "Generating Reports",
      description: "Learn how to create and customize student reports",
      duration: "4:55",
      thumbnail: "/video.jpg",
      category: "Reports",
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
        <h2 className="text-3xl font-bold tracking-tight">Video Tutorials</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tutorials.map((tutorial, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="aspect-video relative group cursor-pointer">
              <img
                src={tutorial.thumbnail}
                alt={tutorial.title}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {tutorial.category}
                </span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {tutorial.duration}
                </div>
              </div>
              <CardTitle className="text-lg">{tutorial.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {tutorial.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
