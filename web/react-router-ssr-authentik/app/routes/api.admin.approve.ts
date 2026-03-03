import type { Route } from "./+types/api.admin.approve";
import { requireUser } from "~/lib/auth.server";
import { approveUser } from "~/lib/authentik-admin.server";

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  if (!user.groups.includes("sample-ssr-admins")) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const userPk = Number(form.get("userPk"));

  if (!userPk) {
    return Response.json(
      { success: false, error: "Missing userPk" },
      { status: 400 }
    );
  }

  try {
    await approveUser(userPk);
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
