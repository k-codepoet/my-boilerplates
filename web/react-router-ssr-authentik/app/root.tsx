import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  redirect,
} from "react-router";

import type { Route } from "./+types/root";
import { getUser } from "~/lib/auth.server";
import "./app.css";

const PUBLIC_PATHS = ["/login", "/auth/", "/api/auth/"];
const APPROVAL_EXEMPT_PATHS = [...PUBLIC_PATHS, "/pending", "/banned"];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const isPublic = PUBLIC_PATHS.some((p) => url.pathname.startsWith(p));

  if (isPublic) {
    return { user: null };
  }

  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }

  // --- Customize group names below for your app ---
  const isBanned = user.groups.includes("sample-ssr-users-banned");
  if (isBanned && !url.pathname.startsWith("/banned")) {
    throw redirect("/banned");
  }

  const isApproved =
    user.groups.includes("sample-ssr-users") ||
    user.groups.includes("sample-ssr-admins");
  const isExempt = APPROVAL_EXEMPT_PATHS.some((p) =>
    url.pathname.startsWith(p)
  );

  if (!isApproved && !isExempt) {
    throw redirect("/pending");
  }

  if (url.pathname.startsWith("/admin")) {
    if (!user.groups.includes("sample-ssr-admins")) {
      throw redirect("/");
    }
  }

  return { user };
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <footer className="fixed bottom-2 right-3 text-[10px] text-muted-foreground/40">
          {__APP_VERSION__} · {__BUILD_TIME__}
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{message}</h1>
        <p className="mt-2 text-muted-foreground">{details}</p>
        {stack && (
          <pre className="mt-4 overflow-x-auto rounded bg-muted p-4 text-left text-sm">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}

declare const __BUILD_TIME__: string;
declare const __APP_VERSION__: string;
