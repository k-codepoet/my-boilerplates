import { NavLink, Outlet } from "react-router";
import { Home, FolderOpen, Settings, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { cn } from "~/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/files", icon: FolderOpen, label: "Files" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      const update = await check();
      if (update) {
        setUpdateAvailable(true);
      }
    } catch (e) {
      console.log("Update check failed:", e);
    }
  }

  async function installUpdate() {
    try {
      setUpdating(true);
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } catch (e) {
      console.error("Update failed:", e);
      setUpdating(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-muted/30">
        <div className="flex h-14 items-center border-b border-border px-4">
          <h1 className="font-semibold">Tauri App</h1>
        </div>

        <nav className="flex-1 p-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Update button */}
        {updateAvailable && (
          <div className="border-t border-border p-2">
            <button
              onClick={installUpdate}
              disabled={updating}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", updating && "animate-spin")} />
              {updating ? "Updating..." : "Update Available"}
            </button>
          </div>
        )}

        {/* Version */}
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          v0.1.0
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
