import { Helmet } from "react-helmet-async";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Terms of Service | IFIX</title>
        <meta name="description" content="Terms for using the IFIX website and YSOTA AI support assistant." />
      </Helmet>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-muted-foreground">Terms for using the IFIX website and its support features.</p>

        <section className="mt-10 space-y-3" aria-labelledby="ai-assistant-terms">
          <h2 id="ai-assistant-terms" className="text-xl font-semibold">YSOTA AI assistant</h2>
          <p className="leading-7 text-muted-foreground">
            YSOTA AI uses OpenAI to generate responses to your questions. Do not share passwords, payment details, or private account information in the chat. AI responses may be inaccurate or incomplete; confirm product details, prices, stock, compatibility, and delivery with IFIX before making a purchase.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
