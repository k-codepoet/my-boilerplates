import type { Route } from "./+types/api.admin.change-role";
import { requireUser } from "~/lib/auth.server";
import {
  changeUserRole,
  type UserRole,
} from "~/lib/authentik-admin.server";

const VALID_ROLES: UserRole[] = ["pending", "user", "admin", "banned"];

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  if (!user.groups.includes("sample-ssr-admins")) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const userPk = Number(form.get("userPk"));
  const newRole = form.get("newRole") as UserRole;

  if (!userPk || !VALID_ROLES.includes(newRole)) {
    return Response.json(
      { success: false, error: "Invalid parameters" },
      { status: 400 }
    );
  }

  try {
    await changeUserRole(userPk, newRole);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
