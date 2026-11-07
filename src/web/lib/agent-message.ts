import type { Attachment } from "@/components/composer/attachments";
import { imageMarker, pastedBlock } from "@/lib/user-message";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

const MAX_EDGE_PX = 1568;
const MAX_PNG_BYTES = 3_500_000;
const JPEG_QUALITY = 0.85;

function readBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function decode(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function prepareImage(file: File): Promise<{ mediaType: string; data: string }> {
  const image = await decode(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  context?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const png = await encode(canvas, "image/png");
  if (png && png.size <= MAX_PNG_BYTES) {
    return { mediaType: png.type, data: await readBase64(png) };
  }
  if (context) {
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const blob = await encode(canvas, "image/jpeg", JPEG_QUALITY);
  if (!blob) throw new Error("Could not prepare the image");
  return { mediaType: blob.type, data: await readBase64(blob) };
}

type ImageAttachment = Extract<Attachment, { kind: "image" }>;

const sentImages = (attachments: readonly Attachment[]) =>
  attachments.filter(
    (attachment): attachment is ImageAttachment =>
      attachment.kind === "image" && Boolean(attachment.file),
  );

export function messageText(text: string, attachments: readonly Attachment[]): string {
  const parts = [text.trim()];
  for (const attachment of attachments) {
    if (attachment.kind === "text" && attachment.content) {
      parts.push(pastedBlock(attachment.content));
    }
    if (attachment.kind === "file") {
      const path = attachment.path ?? (attachment.file && window.api.pathForFile(attachment.file));
      if (path) parts.push(`@${path}`);
    }
  }
  const markers = sentImages(attachments)
    .map((image, index) => imageMarker(index + 1, image.name))
    .filter(Boolean);
  if (markers.length) parts.push(markers.join("\n"));
  return parts.filter(Boolean).join("\n\n");
}

export async function agentMessage(
  text: string,
  attachments: readonly Attachment[],
): Promise<string | ContentBlock[]> {
  const body = messageText(text, attachments);
  const images = sentImages(attachments);
  if (images.length === 0) return body;
  const blocks: ContentBlock[] = await Promise.all(
    images.map(async (image) => {
      const prepared = await prepareImage(image.file as File);
      return {
        type: "image" as const,
        source: { type: "base64" as const, media_type: prepared.mediaType, data: prepared.data },
      };
    }),
  );
  return body ? [...blocks, { type: "text", text: body }] : blocks;
}
