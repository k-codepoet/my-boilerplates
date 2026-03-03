import { useState, useRef, useEffect } from "react";
import type { AuthUser } from "~/types";

interface UserMenuProps {
  user: AuthUser;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getRoleBadge(
  groups: string[]
): { label: string; color: string } | null {
  if (groups.includes("sample-ssr-admins")) {
    return { label: "Admin", color: "text-purple-600 bg-purple-50" };
  }
  return null;
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.groups?.includes("sample-ssr-admins");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title={user.name}
      >
        {getInitials(user.name)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            {getRoleBadge(user.groups) && (
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadge(user.groups)!.color}`}
              >
                {getRoleBadge(user.groups)!.label}
              </span>
            )}
          </div>

          <div className="py-1">
            {isAdmin && (
              <a
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setOpen(false)}
              >
                User Management
              </a>
            )}
            <form method="post" action="/auth/logout">
              <button
                type="submit"
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
