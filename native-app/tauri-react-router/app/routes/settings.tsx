import type { Route } from "./+types/settings";
import { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { open } from "@tauri-apps/plugin-shell";
import { appDataDir, appConfigDir } from "@tauri-apps/api/path";
import { RefreshCw, ExternalLink, Folder } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - Tauri App" },
    { name: "description", content: "App settings" },
  ];
}

export default function Settings() {
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [paths, setPaths] = useState({ appData: "", appConfig: "" });

  useEffect(() => {
    loadPaths();
  }, []);

  async function loadPaths() {
    try {
      const [appData, appConfig] = await Promise.all([
        appDataDir(),
        appConfigDir(),
      ]);
      setPaths({ appData, appConfig });
    } catch (e) {
      console.error("Failed to load paths:", e);
    }
  }

  async function checkForUpdates() {
    setChecking(true);
    setUpdateStatus("Checking...");
    try {
      const update = await check();
      if (update) {
        setUpdateStatus(`Update available: ${update.version}`);
      } else {
        setUpdateStatus("You're on the latest version");
      }
    } catch (e) {
      setUpdateStatus("Update check failed");
    }
    setChecking(false);
  }

  async function openPath(path: string) {
    try {
      await open(path);
    } catch (e) {
      console.error("Failed to open path:", e);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-muted-foreground">앱 설정 및 정보</p>

      <div className="mt-8 space-y-8">
        {/* Updates */}
        <section>
          <h2 className="text-lg font-semibold">Updates</h2>
          <div className="mt-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Version</p>
                <p className="text-sm text-muted-foreground">v0.1.0</p>
              </div>
              <button
                onClick={checkForUpdates}
                disabled={checking}
                className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                <RefreshCw className={checking ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                Check for Updates
              </button>
            </div>
            {updateStatus && (
              <p className="mt-3 text-sm text-muted-foreground">{updateStatus}</p>
            )}
          </div>
        </section>

        {/* Paths */}
        <section>
          <h2 className="text-lg font-semibold">Storage Paths</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">App Data</p>
                <p className="text-sm text-muted-foreground">{paths.appData || "Loading..."}</p>
              </div>
              {paths.appData && (
                <button
                  onClick={() => openPath(paths.appData)}
                  className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
                >
                  <Folder className="h-4 w-4" />
                  Open
                </button>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">App Config</p>
                <p className="text-sm text-muted-foreground">{paths.appConfig || "Loading..."}</p>
              </div>
              {paths.appConfig && (
                <button
                  onClick={() => openPath(paths.appConfig)}
                  className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
                >
                  <Folder className="h-4 w-4" />
                  Open
                </button>
              )}
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-lg font-semibold">About</h2>
          <div className="mt-4 rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">
              Built with Tauri v2 + React Router v7
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => open("https://tauri.app")}
                className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
              >
                <ExternalLink className="h-4 w-4" />
                Tauri Docs
              </button>
              <button
                onClick={() => open("https://reactrouter.com")}
                className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
              >
                <ExternalLink className="h-4 w-4" />
                React Router Docs
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
