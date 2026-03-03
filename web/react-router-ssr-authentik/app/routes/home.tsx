import type { Route } from "./+types/home";
import { requireUser } from "~/lib/auth.server";
import { UserMenu } from "~/components/user-menu";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My App" },
    { name: "description", content: "Welcome to my app!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return { user };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">My App</h1>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome, {user.name}
          </h2>
          <p className="mt-2 text-muted-foreground">
            You are signed in as {user.email}
          </p>
          <div className="mt-6 flex gap-4 justify-center">
            <a
              href="https://reactrouter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              React Router Docs
            </a>
            {user.groups.includes("sample-ssr-admins") && (
              <a
                href="/admin"
                className="rounded-lg border border-input px-4 py-2 hover:bg-accent"
              >
                Admin Panel
              </a>
            )}
          </div>
          <footer className="mt-12 text-xs text-muted-foreground/60">
            {__APP_VERSION__} · {__BUILD_TIME__}
          </footer>
        </div>
      </main>
    </div>
  );
}

declare const __BUILD_TIME__: string;
declare const __APP_VERSION__: string;
