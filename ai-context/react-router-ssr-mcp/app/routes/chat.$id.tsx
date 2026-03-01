import { Link, Form, useNavigation } from "react-router";
import type { Route } from "./+types/chat.$id";
import { getChatSessionWithMessages, addChatMessage } from "~/lib/queries";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef } from "react";

export function meta({ data }: Route.MetaArgs) {
  const title = data?.session?.title ?? "Not Found";
  return [{ title: `${title} - Chat - Context Manager` }];
}

export function loader({ params }: Route.LoaderArgs) {
  const session = getChatSessionWithMessages(params.id);
  if (!session) {
    throw new Response("Not Found", { status: 404 });
  }
  return { session };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const content = formData.get("content");
  const role = formData.get("role");

  if (typeof content !== "string" || !content.trim()) {
    return { error: "Message content is required" };
  }

  addChatMessage(
    params.id,
    typeof role === "string" ? role : "user",
    content.trim()
  );

  return { ok: true };
}

export default function ChatSession({ loaderData }: Route.ComponentProps) {
  const { session } = loaderData;
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (navigation.state === "loading") {
      formRef.current?.reset();
    }
  }, [navigation.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages.length]);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="shrink-0 pb-4">
        <Link
          to="/chat"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{session.title}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-4">
        {session.messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          <div className="space-y-4">
            {session.messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border shadow-sm"
                  }`}
                >
                  <div className="mb-1 text-xs opacity-60">
                    {m.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <Form
        ref={formRef}
        method="post"
        className="mt-4 flex shrink-0 items-center gap-2"
      >
        <input type="hidden" name="role" value="user" />
        <input
          name="content"
          type="text"
          placeholder="Type a message..."
          autoComplete="off"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </Form>
    </div>
  );
}
