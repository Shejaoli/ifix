import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowRight, CheckCircle2, Clock3, MapPin, ShieldCheck, Wrench } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

const devices = ["iPhone", "iPad", "MacBook", "Apple Watch", "AirPods", "Other device"];

export default function Repair() {
  const [device, setDevice] = useState("iPhone");

  const submitRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const issue = String(form.get("issue") || "").trim();
    const message = [
      "Hello IFIX, I would like to request a device repair.",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Device: ${device}`,
      `Issue: ${issue}`,
    ].join("\n");
    window.open(`https://wa.me/250788442127?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Apple Device Repair in Kigali | IFIX Rwanda</title>
        <meta name="description" content="Request iPhone, iPad, MacBook, Apple Watch or AirPods repair from IFIX in Kigali. Tell us what is wrong and our team will help you with the next step." />
        <link rel="canonical" href="https://ifix.rw/repair" />
      </Helmet>
      <Navbar />
      <WhatsAppFloat />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary"><Wrench className="h-4 w-4" /> IFIX repair service</span>
            <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">Let’s get your device working again.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Request support for your iPhone, iPad, MacBook, Apple Watch or AirPods. Send us the details and our Kigali team will follow up on WhatsApp.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "Careful diagnosis", text: "We’ll discuss the issue before you proceed." },
                { icon: Clock3, title: "Quick response", text: "Our team will help arrange the next step." },
                { icon: MapPin, title: "Kigali support", text: "Local help from the IFIX team." },
              ].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-border bg-card p-4"><Icon className="h-5 w-5 text-primary" /><p className="mt-3 text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div>)}
            </div>
          </div>

          <form onSubmit={submitRequest} className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-slate-900/5 sm:p-7">
            <h2 className="text-xl font-black">Request a repair</h2>
            <p className="mt-1 text-sm text-muted-foreground">Share a few details to start a WhatsApp conversation.</p>
            <div className="mt-6 space-y-4">
              <label className="block space-y-1.5 text-sm font-semibold">Your name<input name="name" required autoComplete="name" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="Full name" /></label>
              <label className="block space-y-1.5 text-sm font-semibold">Phone number<input name="phone" required type="tel" autoComplete="tel" className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="+250 7xx xxx xxx" /></label>
              <label className="block space-y-1.5 text-sm font-semibold">Device<select value={device} onChange={(event) => setDevice(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary">{devices.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="block space-y-1.5 text-sm font-semibold">What is wrong?<textarea name="issue" required rows={4} className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="Describe the problem, symptoms, or damage..." /></label>
              <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md transition hover:-translate-y-0.5 hover:bg-primary/90"><CheckCircle2 className="h-4 w-4" /> Continue on WhatsApp <ArrowRight className="h-4 w-4" /></button>
              <p className="text-center text-xs text-muted-foreground">Or call <a href="tel:+250788442127" className="font-bold text-primary hover:underline">+250 788 442 127</a></p>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
