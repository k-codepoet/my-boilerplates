import { redirect } from "react-router";
import type { Route } from "./+types/pending";
import { getUser } from "~/lib/auth.server";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Pending Approval" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (!user) throw redirect("/login");

  if (user.groups.includes("sample-ssr-users")) {
    throw redirect("/");
  }

  return { user };
}

export default function PendingPage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-4">&#x23F3;</div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Pending Approval</h1>
        <p className="text-sm text-gray-500 mb-2">
          Welcome, {user.name}!
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Your account is awaiting admin approval.
        </p>

        <a
          href="/auth/login"
          className="inline-flex items-center justify-center w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          Check approval status
        </a>

        <form method="post" action="/auth/logout" className="mt-3">
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
