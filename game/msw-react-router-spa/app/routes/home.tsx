import { Link } from "react-router";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-53px)] gap-8">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold tracking-tight">MSW Engine</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          A minimal, structured game engine for the web. Built with TypeScript
          and Canvas.
        </p>
      </div>
      <Link
        to="/play"
        className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Play Game
      </Link>
    </div>
  );
}
