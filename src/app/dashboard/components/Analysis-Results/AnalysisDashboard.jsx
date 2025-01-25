import React from "react";
import {
  LineChart,
  BarChart,
  ResponsiveContainer,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalysisDashboard({ analysisData }) {
  if (!analysisData) return null;

  const ConceptMasteryChart = () => (
    <Card className="w-full h-96">
      <CardHeader>
        <CardTitle>Concept Mastery Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={Object.entries(
              analysisData.overallAssessment.conceptualUnderstanding
                .keyConceptsMastery
            ).map(([concept, score]) => ({ concept, score }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="concept" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const SkillProgressChart = () => (
    <Card className="w-full h-96">
      <CardHeader>
        <CardTitle>Skill Progress Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={Object.entries(
              analysisData.overallAssessment.technicalSkills.progressIndicators
            ).map(([skill, progress]) => ({ skill, progress }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="skill" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="progress" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const LearningPathTimeline = () => (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Personalized Learning Path</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-primary">Short-term Goals</h4>
            <ul className="mt-2 space-y-2">
              {analysisData.overallAssessment.learningPath.shortTerm.map(
                (goal, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {goal}
                  </li>
                )
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary">Medium-term Goals</h4>
            <ul className="mt-2 space-y-2">
              {analysisData.overallAssessment.learningPath.mediumTerm.map(
                (goal, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {goal}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <ConceptMasteryChart />
      <SkillProgressChart />
      <LearningPathTimeline />
    </div>
  );
}
