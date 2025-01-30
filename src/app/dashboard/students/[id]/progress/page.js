"use client";

import { useParams } from "next/navigation";
import StudentProgressReport from "@/app/dashboard/components/StudentProgressReport";

export default function StudentProgressPage() {
  const params = useParams();
  const studentId = params.id;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <StudentProgressReport studentId={studentId} />
    </div>
  );
}
