import { Link } from "react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "~/lib/layout.shared";

export default function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-col items-center justify-center flex-1 gap-8 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold tracking-tight">GameGlue</h1>
          <p className="text-xl text-fd-muted-foreground max-w-md">
            A minimal, structured game engine for the web. Built with TypeScript
            and Canvas.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            to="/play"
            className="px-8 py-3 bg-fd-primary text-fd-primary-foreground rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Play Game
          </Link>
          <Link
            to="/docs"
            className="px-8 py-3 border border-fd-border rounded-lg text-lg font-semibold hover:bg-fd-accent transition-colors"
          >
            Docs
          </Link>
        </div>
      </div>
    </HomeLayout>
  );
}
