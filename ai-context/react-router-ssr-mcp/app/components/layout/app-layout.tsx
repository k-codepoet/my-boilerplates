import { NavLink, Outlet } from "react-router";
import { LayoutDashboard, Package, ArrowLeftRight, Upload } from "lucide-react";
import { cn } from "~/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/items", icon: Package, label: "Items" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/import", icon: Upload, label: "Import" },
];

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            Context Manager
          </h1>
        </div>
        <nav className="space-y-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 w-60 px-4">
          <div className="rounded-md bg-sidebar-accent/50 px-3 py-2 text-xs text-sidebar-foreground/50">
            MCP: context-manager
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center border-b px-4 md:px-6">
          <h2 className="text-lg font-semibold md:hidden">Context Manager</h2>
          <div className="ml-auto text-xs text-muted-foreground">
            Claude Code CLI + MCP
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
