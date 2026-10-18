import { isValidEmail } from "./email-validator";

export function parseEmailList(content: string): string[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const emails: string[] = [];

  for (const line of lines) {
    const columns = line.split(",").map((value) => value.trim());

    for (const column of columns) {
      if (isValidEmail(column)) {
        emails.push(column);
      }
    }
  }

  return [...new Set(emails)];
}