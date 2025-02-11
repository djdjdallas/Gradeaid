import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function cleanResponseText(text) {
  return (
    text
      // Remove any markdown code blocks
      .replace(/```json\n?|```\n?/g, "")
      // Remove any non-printable characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
      // Remove any BOM
      .replace(/^\uFEFF/, "")
      // Remove any leading/trailing whitespace
      .trim()
      // Fix escaped quotes
      .replace(/\\"/g, '"')
      // Handle newlines consistently
      .replace(/\r?\n/g, "\\n")
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, "$1")
      // Remove any non-JSON content before or after
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1")
  );
}
