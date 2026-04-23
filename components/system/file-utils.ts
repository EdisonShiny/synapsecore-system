"use client";

import { createId } from "@/src/utils/id";
import type { AttachmentReference } from "@/types/system";

export function filesToAttachmentReferences(fileList: FileList | null) {
  const files = Array.from(fileList ?? []);

  return files.map<AttachmentReference>((file) => {
    const extensionMatch = /\.[^.]+$/.exec(file.name.toLowerCase());

    return {
      id: createId(),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      extension: extensionMatch ? extensionMatch[0] : ""
    };
  });
}
