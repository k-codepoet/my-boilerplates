import { useState } from "react";
import { redirect, useFetcher, useRevalidator } from "react-router";
import type { Route } from "./+types/admin";
import { requireUser } from "~/lib/auth.server";
import {
  getAllUsers,
  type UserWithRole,
  type UserRole,
} from "~/lib/authentik-admin.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "User Management" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  if (!user.groups.includes("sample-ssr-admins")) {
    throw redirect("/");
  }

  let users: UserWithRole[] = [];
  let error: string | null = null;
  try {
    users = await getAllUsers();
  } catch (e) {
    error =
      e instanceof Error ? e.message : "Failed to load users";
  }

  return { user, users, error };
}

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; badge: string; badgeBg: string }
> = {
  pending: {
    label: "Pending",
    badge: "text-amber-700",
    badgeBg: "bg-amber-50 border-amber-200",
  },
  user: {
    label: "User",
    badge: "text-blue-700",
    badgeBg: "bg-blue-50 border-blue-200",
  },
  admin: {
    label: "Admin",
    badge: "text-purple-700",
    badgeBg: "bg-purple-50 border-purple-200",
  },
  banned: {
    label: "Banned",
    badge: "text-red-700",
    badgeBg: "bg-red-50 border-red-200",
  },
};

const FILTER_TABS: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "user", label: "Users" },
  { value: "admin", label: "Admins" },
  { value: "banned", label: "Banned" },
];

function RoleBadge({ role }: { role: UserRole }) {
  const config = ROLE_CONFIG[role];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.badge} ${config.badgeBg}`}
    >
      {config.label}
    </span>
  );
}

function UserRow({
  user,
  currentUserEmail,
}: {
  user: UserWithRole;
  currentUserEmail: string;
}) {
  const fetcher = useFetcher();
  const isChanging = fetcher.state !== "idle";
  const isSelf = user.email === currentUserEmail;
  const error =
    fetcher.data && !(fetcher.data as { success?: boolean }).success
      ? (fetcher.data as { error?: string }).error
      : null;

  const displayRole: UserRole =
    isChanging && fetcher.formData
      ? (fetcher.formData.get("newRole") as UserRole)
      : user.role;

  return (
    <tr
      className={`border-b border-gray-100 last:border-0 ${isChanging ? "opacity-60" : ""}`}
    >
      <td className="py-3 pr-3 pl-4">
        <div>
          <p className="font-medium text-gray-900 text-sm">
            {user.name || user.username}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </td>
      <td className="py-3 px-3">
        <RoleBadge role={displayRole} />
      </td>
      <td className="py-3 pl-3 pr-4 text-right">
        {isSelf ? (
          <span className="text-xs text-gray-400">You</span>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            {error && (
              <span className="text-xs text-red-500 mr-1">{error}</span>
            )}
            {(["pending", "user", "admin", "banned"] as UserRole[])
              .filter((r) => r !== user.role)
              .map((role) => (
                <RoleButton
                  key={role}
                  userPk={user.pk}
                  role={role}
                  fetcher={fetcher}
                  isChanging={isChanging}
                />
              ))}
          </div>
        )}
      </td>
    </tr>
  );
}

function RoleButton({
  userPk,
  role,
  fetcher,
  isChanging,
}: {
  userPk: number;
  role: UserRole;
  fetcher: ReturnType<typeof useFetcher>;
  isChanging: boolean;
}) {
  const styles: Record<UserRole, string> = {
    pending: "border-amber-300 text-amber-700 hover:bg-amber-50",
    user: "border-blue-300 text-blue-700 hover:bg-blue-50",
    admin: "border-purple-300 text-purple-700 hover:bg-purple-50",
    banned: "border-red-300 text-red-700 hover:bg-red-50",
  };

  return (
    <fetcher.Form method="post" action="/api/admin/change-role">
      <input type="hidden" name="userPk" value={userPk} />
      <input type="hidden" name="newRole" value={role} />
      <button
        type="submit"
        disabled={isChanging}
        className={`rounded border px-2 py-1 text-xs font-medium transition disabled:opacity-40 ${styles[role]}`}
      >
        {ROLE_CONFIG[role].label}
      </button>
    </fetcher.Form>
  );
}

export default function AdminPage({ loaderData }: Route.ComponentProps) {
  const { user, users, error } = loaderData;
  const [filter, setFilter] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");
  const revalidator = useRevalidator();

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts: Record<UserRole | "all", number> = {
    all: users.length,
    pending: users.filter((u) => u.role === "pending").length,
    user: users.filter((u) => u.role === "user").length,
    admin: users.filter((u) => u.role === "admin").length,
    banned: users.filter((u) => u.role === "banned").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage user roles and access
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => revalidator.revalidate()}
              disabled={revalidator.state === "loading"}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              {revalidator.state === "loading" ? "Refreshing..." : "Refresh"}
            </button>
            <a
              href="/"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Back
            </a>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                filter === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-xs opacity-60">
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">
                {search ? "No results found" : "No users"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="py-3 pr-3 pl-4">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="px-4">
                {filtered.map((u) => (
                  <UserRow
                    key={u.pk}
                    user={u}
                    currentUserEmail={user.email}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
