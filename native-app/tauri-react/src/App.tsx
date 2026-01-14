import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { FolderOpen, Save, RefreshCw, FileText } from "lucide-react";

function App() {
  const [content, setContent] = useState("");
  const [filePath, setFilePath] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");

  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      const update = await check();
      if (update) {
        setUpdateAvailable(true);
        setUpdateStatus(`Update available: ${update.version}`);
      }
    } catch (e) {
      console.log("Update check failed:", e);
    }
  }

  async function installUpdate() {
    try {
      setUpdateStatus("Downloading update...");
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        setUpdateStatus("Update installed. Restarting...");
        await relaunch();
      }
    } catch (e) {
      setUpdateStatus(`Update failed: ${e}`);
    }
  }

  async function openFile() {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "Text", extensions: ["txt", "md", "json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (selected) {
        const path = selected as string;
        const text = await readTextFile(path);
        setContent(text);
        setFilePath(path);
      }
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  }

  async function saveFile() {
    if (!filePath) return;
    try {
      await writeTextFile(filePath, content);
      alert("File saved!");
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Tauri + React</h1>
        <div className="flex items-center gap-2">
          {updateAvailable && (
            <button
              onClick={installUpdate}
              className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Update
            </button>
          )}
        </div>
      </header>

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
          disabled={!filePath}
          className="flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        {filePath && (
          <span className="ml-4 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {filePath}
          </span>
        )}
      </div>

      {/* Content */}
      <main className="flex-1 p-4">
        {filePath ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ minHeight: "calc(100vh - 180px)" }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-muted-foreground">Open a file to start editing</p>
            <button
              onClick={openFile}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Open File
            </button>
          </div>
        )}
      </main>

      {/* Status bar */}
      <footer className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>v0.1.0</span>
        {updateStatus && <span>{updateStatus}</span>}
      </footer>
    </div>
  );
}

export default App;
