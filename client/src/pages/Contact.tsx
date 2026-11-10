import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Contact() {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Contact IFIX | Get Support in Rwanda</title>
        <meta name="description" content="Contact IFIX in Kigali, Rwanda. Phone, email, WhatsApp support available 24/7. Visit our store or reach out with any questions." />
        <meta property="og:title" content="Contact IFIX" />
        <meta property="og:description" content="Get in touch with IFIX. Available by phone, email, and WhatsApp in Kigali, Rwanda." />
        <meta property="og:url" content="https://ifix.rw/contact" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact IFIX" />
        <meta name="twitter:description" content="Reach out to us for support and inquiries." />
        <link rel="canonical" href="https://ifix.rw/contact" />
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
      </Helmet>
      <Navbar />
      <WhatsAppFloat />

      <div className="py-12 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground">Contact Us</h1>
            <p className="mt-4 text-lg text-muted-foreground">We'd love to hear from you. Visit our store or send us a message.</p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            
            {/* Contact Info Cards */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">Call Us</h3>
                <a href="tel:+250788442127" className="text-muted-foreground transition-colors hover:text-primary">+250 788 442 127</a>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">Email Us</h3>
                <p className="text-muted-foreground break-words">ifixelectronics@gmail.com</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 sm:col-span-2">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">Visit Our Store</h3>
                <p className="text-muted-foreground">
                  KN 48 St, Kigali, Rwanda <br />
                  Google Maps Code: 3335+6Q Kigali
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 sm:col-span-2">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">Opening Hours</h3>
                <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                  <div>
                    <p className="text-foreground font-medium">Monday - Friday</p>
                    <p>8:00 AM - 9:00 PM</p>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Saturday</p>
                    <p>9:00 AM - 8:00 PM</p>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Sunday</p>
                    <p>Closed</p>
                  </div>
                  <p className="col-span-2 border-t border-border pt-3 text-sm">Times are in CAT (GMT+2)</p>
                </div>
              </div>
            </div>

            {/* Map Placeholder or Form */}
            <div className="rounded-3xl border border-border bg-card p-2 overflow-hidden h-[400px] lg:h-auto">
               <iframe 
                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.532736173456!2d30.058!3d-1.95!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMsKwNTcnMDAuMCJTIDMwwrAwMycwMC4wIkU!5e0!3m2!1sen!2srw!4v1620000000000!5m2!1sen!2srw" 
                 width="100%" 
                 height="100%" 
                 style={{ border: 0, borderRadius: '1rem' }} 
                 allowFullScreen 
                 loading="lazy" 
                 referrerPolicy="no-referrer-when-downgrade"
               ></iframe>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
