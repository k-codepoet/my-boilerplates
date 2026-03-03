const AUTHENTIK_API_BASE = "https://auth.codepoet.site/api/v3";

function getApiToken(): string {
  const token = process.env.AUTHENTIK_API_TOKEN;
  if (!token) {
    throw new Error("Missing AUTHENTIK_API_TOKEN environment variable");
  }
  return token;
}

function apiHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiToken()}`,
    "Content-Type": "application/json",
  };
}

export interface AuthentikUser {
  pk: number;
  username: string;
  name: string;
  email: string;
  is_active: boolean;
}

interface AuthentikGroup {
  pk: string;
  name: string;
  users: number[];
  users_obj: AuthentikUser[];
}

interface AuthentikListResponse<T> {
  pagination: { count: number };
  results: T[];
}

// --- Customize these group names for your app ---

export type UserRole = "pending" | "user" | "admin" | "banned";

const ROLE_GROUPS: Record<UserRole, string> = {
  pending: "sample-ssr-users-pending",
  user: "sample-ssr-users",
  admin: "sample-ssr-admins",
  banned: "sample-ssr-users-banned",
};

export interface UserWithRole extends AuthentikUser {
  role: UserRole;
}

const groupPkCache: Record<string, string> = {};

async function getGroupPk(groupName: string): Promise<string> {
  if (groupPkCache[groupName]) return groupPkCache[groupName];

  const res = await fetch(
    `${AUTHENTIK_API_BASE}/core/groups/?name=${encodeURIComponent(groupName)}`,
    { headers: apiHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to fetch group: ${res.statusText}`);

  const data: AuthentikListResponse<AuthentikGroup> = await res.json();
  if (!data.results?.length) throw new Error(`Group not found: ${groupName}`);

  groupPkCache[groupName] = data.results[0].pk;
  return data.results[0].pk;
}

async function getGroupWithUsers(
  groupName: string
): Promise<AuthentikGroup> {
  const pk = await getGroupPk(groupName);
  const res = await fetch(`${AUTHENTIK_API_BASE}/core/groups/${pk}/`, {
    headers: apiHeaders(),
  });
  if (!res.ok)
    throw new Error(`Failed to fetch group details: ${res.statusText}`);
  return res.json();
}

function determineRole(
  userPk: number,
  groupUsers: Record<UserRole, Set<number>>
): UserRole {
  if (groupUsers.banned.has(userPk)) return "banned";
  if (groupUsers.admin.has(userPk)) return "admin";
  if (groupUsers.user.has(userPk)) return "user";
  return "pending";
}

export async function getAllUsers(): Promise<UserWithRole[]> {
  const groups = await Promise.all(
    (Object.entries(ROLE_GROUPS) as [UserRole, string][]).map(
      async ([role, name]) => {
        const group = await getGroupWithUsers(name);
        return { role, group };
      }
    )
  );

  const groupUsers: Record<UserRole, Set<number>> = {
    pending: new Set(),
    user: new Set(),
    admin: new Set(),
    banned: new Set(),
  };

  const usersMap = new Map<number, AuthentikUser>();

  for (const { role, group } of groups) {
    for (const pk of group.users) {
      groupUsers[role].add(pk);
    }
    for (const user of group.users_obj) {
      usersMap.set(user.pk, user);
    }
  }

  return Array.from(usersMap.values()).map((user) => ({
    ...user,
    role: determineRole(user.pk, groupUsers),
  }));
}

export async function getPendingUsers(): Promise<AuthentikUser[]> {
  const users = await getAllUsers();
  return users.filter((u) => u.role === "pending");
}

export async function changeUserRole(
  userPk: number,
  newRole: UserRole
): Promise<void> {
  const groupPks = await Promise.all(
    (Object.entries(ROLE_GROUPS) as [UserRole, string][]).map(
      async ([role, name]) => ({ role, pk: await getGroupPk(name) })
    )
  );

  // Remove user from all app groups first
  await Promise.all(
    groupPks.map(({ pk }) =>
      fetch(`${AUTHENTIK_API_BASE}/core/groups/${pk}/remove_user/`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ pk: userPk }),
      })
    )
  );

  // Add to the target role group(s)
  const targetGroups: UserRole[] =
    newRole === "admin" ? ["user", "admin"] : [newRole];

  for (const role of targetGroups) {
    const gpk = groupPks.find((g) => g.role === role)!.pk;
    const res = await fetch(
      `${AUTHENTIK_API_BASE}/core/groups/${gpk}/add_user/`,
      {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ pk: userPk }),
      }
    );
    if (!res.ok) {
      throw new Error(
        `Failed to add user to ${role} group: ${res.statusText}`
      );
    }
  }
}

export async function approveUser(userPk: number): Promise<void> {
  await changeUserRole(userPk, "user");
}
