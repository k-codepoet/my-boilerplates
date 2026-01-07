import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My App" },
    { name: "description", content: "Welcome to my app!" },
  ];
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">React Router SPA</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          빠른 프론트엔드 목업용 boilerplate
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="https://reactrouter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            React Router Docs
          </a>
          <a
            href="https://tailwindcss.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-input px-4 py-2 hover:bg-accent"
          >
            Tailwind Docs
          </a>
        </div>
        <footer className="mt-12 text-sm text-muted-foreground">
          v0.1.0
        </footer>
      </div>
    </main>
  );
}
