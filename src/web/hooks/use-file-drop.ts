import { useRef, useState, type DragEvent } from "react";

export type DraggedFiles = { images: number; files: number };

function countFiles(items: DataTransferItemList): DraggedFiles {
  const files = Array.from(items).filter((item) => item.kind === "file");
  const images = files.filter((item) => item.type.startsWith("image/")).length;
  return { images, files: files.length - images };
}

const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes("Files");

export function useFileDrop(onFiles: (files: File[]) => void) {
  const [dragging, setDragging] = useState<DraggedFiles | null>(null);
  const depth = useRef(0);

  const dropHandlers = {
    onDragEnter(event: DragEvent) {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setDragging(countFiles(event.dataTransfer.items));
    },
    onDragOver(event: DragEvent) {
      if (carriesFiles(event)) event.preventDefault();
    },
    onDragLeave(event: DragEvent) {
      if (!carriesFiles(event)) return;
      depth.current = Math.max(depth.current - 1, 0);
      if (depth.current === 0) setDragging(null);
    },
    onDrop(event: DragEvent) {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setDragging(null);
      onFiles(Array.from(event.dataTransfer.files));
    },
  };

  return { dragging, dropHandlers };
}
