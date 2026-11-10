import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import teamImg from "@assets/image_1773048940427.png";

export default function About() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "name": "IFIX",
    "url": "https://ifix.rw",
    "telephone": "+250788442127",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "KN 48 St",
      "addressLocality": "Kigali",
      "addressCountry": "RW"
    }
  };

  const stats = [
    { label: "Years in Business", value: "5+" },
    { label: "Happy Customers", value: "10k+" },
    { label: "Products Sold", value: "15k+" },
    { label: "Support", value: "24/7" },
  ];

  const features = [
    "Official Warranties",
    "Original Products Only",
    "Expert Technical Advice",
    "Delivery Across Rwanda",
    "After-sales Support",
    "Secure Payments"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>About IFIX | Rwanda's Premier Electronics Store Since 2019</title>
        <meta name="description" content="About IFIX: Rwanda's leading certified refurbished electronics store in Kigali. Trusted since 2019 with 500,000+ happy customers. Learn our story." />
        <meta property="og:title" content="About IFIX | Rwanda's Premier Electronics Store" />
        <meta property="og:description" content="Rwanda's premier destination for premium electronics. In business since 2019 with a commitment to quality and service." />
        <meta property="og:url" content="https://ifix.rw/about" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About IFIX" />
        <meta name="twitter:description" content="Learn about Rwanda's leading electronics store and our commitment to quality." />
        <link rel="canonical" href="https://ifix.rw/about" />
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
      </Helmet>
      <Navbar />
      <WhatsAppFloat />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              About Us
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Rwanda's Premier Destination for Premium Electronics
            </p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
              <img 
                src={teamImg} 
                alt="IFIX Team"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-foreground">Our Story</h2>
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Welcome to IFIX, where cutting-edge technology meets unparalleled innovation. As a leading force in the electronic industry, we pride ourselves on delivering state-of-the-art solutions that redefine the way we live, work, and connect.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  At IFIX we had been in business since 2019, we leverage the latest advancements in electronics to create a diverse range of products designed to enhance your daily experiences. From sleek and intuitive consumer electronics to robust industrial solutions, our commitment to quality and excellence is unwavering.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 bg-accent/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-foreground mb-8">Our Mission & Values</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Innovation at Heart</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our team of dedicated engineers, designers, and technology enthusiasts work tirelessly to stay ahead of the curve, anticipating the needs of tomorrow. We specialize in crafting products that seamlessly blend form and function, providing not just gadgets, but intelligent solutions that simplify and elevate your lifestyle.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                  Innovation is at the heart of everything we do. Our research and development efforts drive the evolution of our products, ensuring that each release represents the pinnacle of technological achievement. From smart home devices that bring convenience to your fingertips to industrial-grade electronics powering critical infrastructure, IFIX stands as a symbol of progress and reliability.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Customer-First Approach</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Customer satisfaction is paramount to us. We prioritize user-friendly designs, robust performance, and eco-friendly practices to create products that not only meet but exceed your expectations. As a company committed to sustainability, we embrace responsible manufacturing practices and strive to reduce our environmental footprint.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 rounded-3xl bg-accent p-8 text-center sm:grid-cols-4 lg:p-12">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-primary sm:text-4xl">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground mb-12">Why Choose IFIX</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-4 p-6 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-lg text-foreground font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Ready for the Future?</h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Join us on a journey of technological exploration. Whether you're a tech enthusiast, a business seeking cutting-edge solutions, or a consumer looking for the next big thing, IFIX is here to inspire and innovate. Welcome to the future, where possibilities are limitless, and innovation knows no bounds.
          </p>
          <Link href="/shop">
            <Button size="lg" className="gap-2">
              Shop Now <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
