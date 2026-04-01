import { useCallback } from "react";
import { usePdfStore } from "../store/usePdfStore";

export function useFileHandler() {
  const loadFile = usePdfStore((s) => s.loadFile);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf") {
        loadFile(file);
      }
    },
    [loadFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  return { onDrop, onDragOver, onFileSelect };
}
