import mammoth from "mammoth";

const ALLOWED_FILE_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "text/plain": "TXT",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function extractTextFromFile(file) {
  console.log("Attempting to extract text from file:", file.type);

  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File must be smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  if (!ALLOWED_FILE_TYPES[file.type]) {
    throw new Error(
      `Please upload a ${Object.values(ALLOWED_FILE_TYPES).join(", ")} file`
    );
  }

  const fileType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  let text = "";

  try {
    switch (fileType) {
      case "application/pdf":
        console.log("Processing PDF file...");
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(Buffer.from(arrayBuffer));
        text = pdfData.text;
        break;

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        console.log("Processing DOCX file...");
        const result = await mammoth.extractRawText({
          buffer: Buffer.from(arrayBuffer),
        });
        text = result.value;
        break;

      case "text/plain":
        console.log("Processing TXT file...");
        text = new TextDecoder().decode(arrayBuffer);
        break;

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    text = text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
    console.log("Text extraction successful, length:", text.length);
    return text;
  } catch (error) {
    console.error("Error in extractTextFromFile:", error);
    throw new Error(
      `Failed to extract text from ${fileType} file: ${error.message}`
    );
  }
}
