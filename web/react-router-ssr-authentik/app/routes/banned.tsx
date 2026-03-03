import { redirect } from "react-router";
import type { Route } from "./+types/banned";
import { getUser } from "~/lib/auth.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Account Suspended" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (!user) throw redirect("/login");

  if (!user.groups.includes("sample-ssr-users-banned")) {
    throw redirect("/");
  }

  return { user };
}

export default function BannedPage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-4">&#x1F6AB;</div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">
          Account Suspended
        </h1>
        <p className="text-sm text-gray-500 mb-2">{user.name}</p>
        <p className="text-sm text-gray-500 mb-8">
          Your account has been suspended by an administrator.
          <br />
          Please contact your admin for more information.
        </p>

        <form method="post" action="/auth/logout">
          <button
            type="submit"
            className="inline-flex items-center justify-center w-full rounded-lg bg-gray-600 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
