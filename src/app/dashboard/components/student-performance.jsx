//app/dashboard/components/student-performance.jsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function StudentPerformance({ students = [] }) {
  return (
    <div className="space-y-8">
      {students.map((student, index) => (
        <div className="flex items-center" key={`${student.name}-${index}`}>
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`}
              alt="Avatar"
            />
            <AvatarFallback>
              {student.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{student.name}</p>
            <p className="text-sm text-muted-foreground">
              {student.assignmentCount} assignments
            </p>
          </div>
          <div className="ml-auto font-medium flex items-center space-x-2">
            <span className={getGradeColor(student.grade)}>
              {student.grade}
            </span>
            <span className="text-sm text-muted-foreground">
              ({student.assignmentCount})
            </span>
          </div>
        </div>
      ))}
      {students.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          No student data available
        </div>
      )}
    </div>
  );
}

function getGradeColor(grade) {
  switch (grade) {
    case "A":
    case "A-":
      return "text-green-600 font-bold";
    case "B+":
    case "B":
    case "B-":
      return "text-blue-600 font-bold";
    case "C+":
    case "C":
    case "C-":
      return "text-yellow-600 font-bold";
    case "D+":
    case "D":
      return "text-orange-600 font-bold";
    case "F":
      return "text-red-600 font-bold";
    default:
      return "text-gray-600 font-bold";
  }
}
