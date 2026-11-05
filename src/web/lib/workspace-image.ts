const BADGE_PX = 128;

export function workspaceImageUrl(customImage: string | null): string | undefined {
  if (!customImage) return undefined;
  return customImage.startsWith("data:") ? customImage : `nex-file://${customImage}`;
}

export async function readBadgeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = BADGE_PX;
  canvas.height = BADGE_PX;
  canvas
    .getContext("2d")
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      BADGE_PX,
      BADGE_PX,
    );
  bitmap.close();
  return canvas.toDataURL("image/png");
}
