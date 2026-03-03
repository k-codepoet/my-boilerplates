import { redirect } from "react-router";
import type { Route } from "./+types/auth.callback";
import { handleCallback } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    const desc = url.searchParams.get("error_description") || error;
    throw redirect(`/login?error=${encodeURIComponent(desc)}`);
  }

  const { cookie } = await handleCallback(request);
  throw redirect("/", { headers: { "Set-Cookie": cookie } });
}
