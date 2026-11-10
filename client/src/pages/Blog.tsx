import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Blog() {
  const articles = [
    {
      id: 1,
      title: "Best Gaming Consoles to Buy in Rwanda 2026",
      excerpt: "Discover the top gaming consoles available in Rwanda. Compare PS5, Xbox Series X, and Nintendo Switch with prices and availability in Kigali.",
      date: "2026-03-10",
      category: "Gaming",
      slug: "best-gaming-consoles-rwanda-2026"
    },
    {
      id: 2,
      title: "Where to Buy Refurbished iPhones in Kigali",
      excerpt: "Looking for refurbished iPhones in Kigali? Learn why certified refurbished iPhones are a smart choice with our 12-month warranty.",
      date: "2026-03-05",
      category: "Smartphones",
      slug: "buy-refurbished-iphones-kigali"
    },
    {
      id: 3,
      title: "Complete Guide to Refurbished Laptops in Rwanda",
      excerpt: "Everything you need to know about buying certified refurbished laptops. Quality assurance, warranty, and where to buy in Kigali.",
      date: "2026-02-28",
      category: "Laptops",
      slug: "refurbished-laptops-rwanda-guide"
    },
    {
      id: 4,
      title: "Top Gaming Accessories for PS5 and Xbox in 2026",
      excerpt: "Essential gaming accessories to enhance your console experience. Controllers, headsets, and charging stations available in Rwanda.",
      date: "2026-02-20",
      category: "Gaming",
      slug: "best-gaming-accessories-2026"
    },
    {
      id: 5,
      title: "Audio Equipment Guide: Headphones and Speakers in Rwanda",
      excerpt: "Choose the right audio equipment for your needs. Compare brands like Soundcore, Beats, and more with prices in Rwanda.",
      date: "2026-02-15",
      category: "Audio",
      slug: "audio-equipment-guide-rwanda"
    }
  ];

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "IFIX Blog",
    "url": "https://ifix.rw/blog",
    "description": "Latest articles about electronics, gaming, and tech in Rwanda",
    "publisher": {
      "@type": "Organization",
      "name": "IFIX",
      "url": "https://ifix.rw"
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Blog | IFIX - Electronics Tips & Guides for Rwanda</title>
        <meta name="description" content="Read latest articles about gaming consoles, refurbished iPhones, laptops, and electronics in Rwanda. Expert guides and tips for buying certified refurbished gadgets." />
        <meta property="og:title" content="IFIX Blog" />
        <meta property="og:description" content="Tips, guides, and articles about electronics and gaming in Rwanda." />
        <meta property="og:url" content="https://ifix.rw/blog" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IFIX Blog" />
        <meta name="twitter:description" content="Articles about electronics and gaming in Rwanda." />
        <link rel="canonical" href="https://ifix.rw/blog" />
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
      </Helmet>
      <Navbar />
      <WhatsAppFloat />

      <div className="py-12 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
              Electronics Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Expert guides, tips, and articles about electronics, gaming, and tech in Rwanda
            </p>
          </div>

          {/* Articles Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
            {articles.map((article) => (
              <article key={article.id} className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {article.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {article.excerpt}
                    </p>
                    <Link href={`/blog/${article.slug}`}>
                      <Button variant="outline" size="sm">
                        Read More <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
