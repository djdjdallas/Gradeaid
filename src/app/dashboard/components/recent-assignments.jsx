//app/dashboard/components/recent-assignments.jsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function RecentAssignments({ assignments = [] }) {
  const getGradeColor = (grade) => {
    if (!grade || grade === "Not graded") return "bg-gray-500";

    // Remove the % sign and convert to number
    const score = parseInt(grade);
    if (isNaN(score)) return "bg-gray-500";

    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assignment</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell className="font-medium">{assignment.name}</TableCell>
              <TableCell>{assignment.studentName}</TableCell>
              <TableCell>{assignment.subject}</TableCell>
              <TableCell>
                <Badge className={getGradeColor(assignment.grade)}>
                  {assignment.grade}
                </Badge>
              </TableCell>
              <TableCell>{assignment.created_at}</TableCell>
            </TableRow>
          ))}
          {assignments.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No assignments yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
