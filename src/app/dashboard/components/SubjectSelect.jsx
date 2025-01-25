// SubjectSelect.jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SubjectSelect({ subject, setSubject }) {
  const SUBJECTS = [
    { id: "math", name: "Mathematics" },
    { id: "science", name: "Science" },
    { id: "english", name: "English" },
    { id: "history", name: "History" },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Subject</label>
      <Select value={subject} onValueChange={setSubject}>
        <SelectTrigger>
          <SelectValue placeholder="Select a subject" />
        </SelectTrigger>
        <SelectContent>
          {SUBJECTS.map((subj) => (
            <SelectItem key={subj.id} value={subj.id}>
              {subj.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
