"use client";

import { createId } from "@/src/utils/id";
import type { AttachmentReference } from "@/types/system";

const inlineReadableExtensions = new Set([".txt", ".md", ".csv", ".json", ".log", ".xml"]);
const maxInlineBytes = 200_000;

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}.`));
    reader.readAsText(file);
  });
}

export async function filesToAttachmentReferences(fileList: FileList | null) {
  const files = Array.from(fileList ?? []);
  const attachments: AttachmentReference[] = [];

  for (const file of files) {
    const extensionMatch = /\.[^.]+$/.exec(file.name.toLowerCase());
    const extension = extensionMatch ? extensionMatch[0] : "";
    let contentText = "";
    let contentStatus: AttachmentReference["contentStatus"] = "metadata-only";

    if (inlineReadableExtensions.has(extension) && file.size <= maxInlineBytes) {
      try {
        contentText = await readFileAsText(file);
        contentStatus = "inline-text";
      } catch {
        contentStatus = "metadata-only";
      }
    } else if (inlineReadableExtensions.has(extension) && file.size > maxInlineBytes) {
      contentStatus = "too-large";
    } else if (extension) {
      contentStatus = "unsupported";
    }

    attachments.push({
      id: createId(),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      extension,
      contentText,
      contentStatus
    });
  }

  return attachments;
}
