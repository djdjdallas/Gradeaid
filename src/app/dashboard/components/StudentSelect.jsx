import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// StudentSelect.jsx
export function StudentSelect({ students, studentId, setStudentId }) {
  const safeArrayLength = (arr) => (Array.isArray(arr) ? arr.length : 0);
  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Student</label>
      <Select value={studentId} onValueChange={setStudentId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a student" />
        </SelectTrigger>
        <SelectContent>
          {safeArray(students).map((student) => (
            <SelectItem key={student.id} value={student.id}>
              {student.full_name} - Grade {student.grade_level || "N/A"}
            </SelectItem>
          ))}
          {safeArrayLength(students) === 0 && (
            <SelectItem value="none" disabled>
              No students available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
