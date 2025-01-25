// FileUpload.jsx
import { Input } from "@/components/ui/input";
export function FileUpload({ onFileUpload, analyzing }) {
  const ALLOWED_FILE_TYPES = {
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "text/plain": "TXT",
  };
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Upload Paper</label>
      <Input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={onFileUpload}
        disabled={analyzing}
        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
      />
      <p className="text-sm text-muted-foreground">
        Supported formats: {Object.values(ALLOWED_FILE_TYPES).join(", ")}.
        Maximum size: {MAX_FILE_SIZE / (1024 * 1024)}MB
      </p>
    </div>
  );
}
