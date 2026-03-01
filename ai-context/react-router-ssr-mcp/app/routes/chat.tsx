import { Link, Form, redirect } from "react-router";
import type { Route } from "./+types/chat";
import { listChatSessions, createChatSession } from "~/lib/queries";
import { Plus, MessageSquare } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Chat - Context Manager" }];
}

export function loader() {
  const sessions = listChatSessions();
  return { sessions };
}

export async function action() {
  const id = createChatSession("New Session");
  return redirect(`/chat/${id}`);
}

export default function Chat({ loaderData }: Route.ComponentProps) {
  const { sessions } = loaderData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
          <p className="text-muted-foreground">
            Conversation sessions with Claude Code CLI or web UI.
          </p>
        </div>
        <Form method="post">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Session
          </button>
        </Form>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            No chat sessions yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <Link
              key={s.id}
              to={`/chat/${s.id}`}
              className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{s.title}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(s.updatedAt).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
