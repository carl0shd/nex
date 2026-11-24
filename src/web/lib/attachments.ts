import type { Attachment } from "@/components/composer/attachments";
import { formatFileSize } from "@/lib/file-size";

export function fileAttachment(file: File): Attachment {
  const id = crypto.randomUUID();
  if (file.type.startsWith("image/")) {
    return { id, kind: "image", name: file.name, src: URL.createObjectURL(file), file };
  }
  return { id, kind: "file", name: file.name, size: formatFileSize(file.size), file };
}

export function releaseAttachment(attachment: Attachment) {
  if (attachment.kind === "image" && attachment.src?.startsWith("blob:")) {
    URL.revokeObjectURL(attachment.src);
  }
}
