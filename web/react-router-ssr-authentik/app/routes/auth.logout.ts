import { redirect } from "react-router";
import type { Route } from "./+types/auth.logout";
import { getSession, destroySession } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  const cookie = await destroySession(session);

  throw redirect("/login", { headers: { "Set-Cookie": cookie } });
}
