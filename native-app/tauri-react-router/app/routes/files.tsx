import type { Route } from "./+types/files";
import { useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { FolderOpen, Save, FileText, X } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Files - Tauri App" },
    { name: "description", content: "File management" },
  ];
}

export default function Files() {
  const [content, setContent] = useState("");
  const [filePath, setFilePath] = useState<string | null>(null);
  const [modified, setModified] = useState(false);

  async function openFile() {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "Text", extensions: ["txt", "md", "json", "ts", "tsx", "js"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (selected) {
        const path = selected as string;
        const text = await readTextFile(path);
        setContent(text);
        setFilePath(path);
        setModified(false);
      }
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  }

  async function saveFile() {
    try {
      if (filePath) {
        await writeTextFile(filePath, content);
        setModified(false);
      } else {
        await saveFileAs();
      }
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  }

  async function saveFileAs() {
    try {
      const path = await save({
        filters: [
          { name: "Text", extensions: ["txt", "md"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (path) {
        await writeTextFile(path, content);
        setFilePath(path);
        setModified(false);
      }
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  }

  function closeFile() {
    setContent("");
    setFilePath(null);
    setModified(false);
  }

  function handleChange(value: string) {
    setContent(value);
    setModified(true);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <button
          onClick={openFile}
          className="flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
        >
          <FolderOpen className="h-4 w-4" />
          Open
        </button>
        <button
          onClick={saveFile}
          disabled={!content}
          className="flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        {filePath && (
          <>
            <div className="mx-2 h-4 w-px bg-border" />
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {filePath}
              {modified && <span className="text-destructive">*</span>}
            </span>
            <button
              onClick={closeFile}
              className="ml-auto rounded-md p-1.5 hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        {filePath ? (
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="h-full w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="File contents..."
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-muted-foreground">파일을 열거나 새로 만드세요</p>
            <div className="flex gap-2">
              <button
                onClick={openFile}
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Open File
              </button>
              <button
                onClick={() => {
                  setContent("");
                  setFilePath(null);
                  setModified(true);
                }}
                className="rounded-md border border-input px-4 py-2 hover:bg-accent"
              >
                New File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
