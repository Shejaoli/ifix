import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowRight, LoaderCircle, Send, Sparkles } from "lucide-react";
import type { Product } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ProductMatch = { product: Product; note: string };
type ChatMessage = { role: "user" | "assistant"; content: string; matches?: ProductMatch[] };

const examples = [
  "What time do you close?",
  "Can you deliver to Musanze?",
  "What’s your contact number?",
  "Help me choose a phone for photography",
];

function imageSrc(path: string) {
  return path.startsWith("http") ? path : `${import.meta.env.VITE_API_URL || ""}${path}`;
}

export function YsotaAIAssistant({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch("/api/ysota-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-10).map(({ role, content: message }) => ({ role, content: message })) }),
      });
      const responseText = await response.text();
      let responseData: { message?: string; answer?: string; matches?: ProductMatch[] };
      try {
        responseData = JSON.parse(responseText);
      } catch {
        throw new Error("The local server returned a web page instead of an AI response. Please refresh the site; if it continues, restart the local server.");
      }
      if (!response.ok) {
        if (response.status === 503) throw new Error("YSOTA AI is not connected yet. Please contact us on WhatsApp at +250 788 442 127.");
        throw new Error(responseData.message || "I couldn’t answer just now. Please try again or contact us at +250 788 442 127.");
      }
      if (!responseData.answer) throw new Error(responseData.message || "YSOTA AI returned an empty answer. Please try again.");
      setMessages((current) => [...current, { role: "assistant", content: responseData.answer!, matches: responseData.matches }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        content: error instanceof TypeError
          ? "I can’t reach the assistant right now. Check that the IFIX website is connected, refresh the page, and try again. If it continues, contact us at +250 788 442 127."
          : error instanceof Error ? error.message : "I couldn’t answer just now. Please contact us at +250 788 442 127.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(query);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Ask YSOTA AI for help"
          className={`group inline-flex h-10 w-10 items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-0 text-sm font-semibold text-primary-foreground shadow-sm transition-[width,padding,filter] duration-300 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto sm:px-3 sm:hover:px-4 sm:focus-visible:px-4 ${className}`}
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden whitespace-nowrap sm:inline">AI Support</span>
          <span className="hidden max-w-0 overflow-hidden whitespace-nowrap font-normal opacity-0 transition-[max-width,opacity] duration-300 sm:inline sm:group-hover:max-w-44 sm:group-hover:opacity-85 sm:group-focus-visible:max-w-44 sm:group-focus-visible:opacity-85">
            Chat with YSOTA AI
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="flex h-auto max-h-[min(85vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-5 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="rounded-xl bg-primary/10 p-2 text-primary"><Sparkles className="h-5 w-5" /></span>
            YSOTA AI
          </DialogTitle>
          <DialogDescription className="pt-1">
            Ask about products, store hours, contact details, delivery, or anything else we can help with.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[52vh] min-h-0 space-y-5 overflow-y-auto p-5" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 && (
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="mb-3 text-sm font-medium">What can I help you with?</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => void sendMessage(example)}
                    disabled={loading}
                    className="rounded-full border border-border bg-background px-3 py-2 text-left text-xs transition hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={`${index}-${message.role}`} className="space-y-3">
              <div className={`w-fit max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${message.role === "user" ? "ml-auto rounded-br-sm bg-primary text-primary-foreground" : "mr-auto rounded-bl-sm bg-muted/70 text-foreground"}`}>
                {message.content}
              </div>
              {message.matches && message.matches.length > 0 && (
                <div className="space-y-2 pl-1">
                  {message.matches.map(({ product, note }) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 rounded-2xl border border-border p-3 transition hover:border-primary/60 hover:bg-accent/30"
                    >
                      <img
                        src={imageSrc(product.imageUrl)}
                        alt={product.name}
                        loading="lazy"
                        className="h-20 w-20 shrink-0 rounded-xl bg-muted object-contain p-1"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{product.name}</span>
                        <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{note}</span>
                        <span className="mt-2 block text-sm font-bold text-primary">{product.price.toLocaleString()} RWF</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {product.stockStatus === "pre_order" ? "Available for pre-order" : "In stock"}
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground" role="status">
              <LoaderCircle className="h-4 w-4 animate-spin" /> YSOTA AI is thinking…
            </div>
          )}
          <div ref={conversationEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border bg-background p-4">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="ysota-ai-query">Message YSOTA AI</label>
            <input
              id="ysota-ai-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={1200}
              placeholder="Ask a question or describe what you need…"
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-muted/40 px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
