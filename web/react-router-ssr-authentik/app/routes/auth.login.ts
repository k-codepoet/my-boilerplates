import { redirect } from "react-router";
import type { Route } from "./+types/auth.login";
import { getAuthorizationUrl } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { url, cookie } = await getAuthorizationUrl(request);
  throw redirect(url, { headers: { "Set-Cookie": cookie } });
}
