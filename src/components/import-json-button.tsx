"use client";

import { useRef } from "react";

interface ImportJsonButtonProps {
  onImport: (data: unknown) => void;
}

export function ImportJsonButton({ onImport }: ImportJsonButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImport(json);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);

    // Reset so same file can be re-imported
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFile}
      />
      <button
        className="px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--surface-hover)]"
        onClick={() => fileRef.current?.click()}
      >
        Import JSON
      </button>
    </>
  );
}
