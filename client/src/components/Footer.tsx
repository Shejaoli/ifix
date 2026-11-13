import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Clock3, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { SiInstagram, SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";

const linkClass = "text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-sm";

export function Footer() {
  const reduceMotion = useReducedMotion();
  const whatsappUrl = `https://wa.me/250788442127?text=${encodeURIComponent("Hello IFIX, I have a question about your products.")}`;

  return (
    <footer className="relative isolate overflow-hidden bg-[#071a35] text-white">
      <motion.div
        aria-hidden="true"
        className="footer-store-reveal absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/ifix-store-footer.webp')" }}
        initial={reduceMotion ? false : { clipPath: "inset(100% 0 0 0)" }}
        whileInView={{ clipPath: "inset(0% 0 0 0)" }}
        viewport={{ once: true, amount: 0.08 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#071a35]/88 via-[#071a35]/85 to-[#06152b]/95 backdrop-blur-[2px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-7 pt-12 sm:px-8 sm:pt-16 lg:px-10">
        <div className="mb-12 flex flex-col gap-6 border-b border-white/15 pb-9 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-3">
              <img src="/ifix-logo.png" alt="IFIX Technology" width="445" height="245" className="h-auto w-36 object-contain" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Great technology, trusted in Kigali.</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-white/75">Shop certified electronics with local support, reliable delivery, and warranty care in Rwanda.</p>
          </div>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <SiWhatsapp className="h-4 w-4" /> Chat with our team <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-10 border-b border-white/15 pb-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <nav aria-label="Explore IFIX">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-yellow-300">Explore</h3>
            <ul className="space-y-3">
              <li><Link href="/" className={linkClass}>Home</Link></li>
              <li><Link href="/iphones" className={linkClass}>Shop iPhone</Link></li>
              <li><Link href="/shop?search=iPad" className={linkClass}>Shop iPad</Link></li>
              <li><Link href="/shop?category=Laptops&amp;search=MacBook" className={linkClass}>Shop MacBook</Link></li>
              <li><Link href="/shop" className={linkClass}>Shop all products</Link></li>
              <li><Link href="/repair" className={linkClass}>Device repair</Link></li>
              <li><Link href="/deals" className={linkClass}>Hot deals</Link></li>
              <li><Link href="/about" className={linkClass}>Our story</Link></li>
              <li><Link href="/contact" className={linkClass}>Customer support</Link></li>
            </ul>
          </nav>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-yellow-300">Visit us</h3>
            <a href="https://maps.google.com/?q=TCB+Building+Kigali+Rwanda" target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 text-sm text-white/75 transition hover:text-white">
              <span className="mt-0.5 rounded-lg bg-white/10 p-2 text-sky-300 group-hover:bg-white/15"><MapPin className="h-4 w-4" /></span>
              <span><strong className="block font-semibold text-white">IFIX</strong><span className="mt-1 block leading-5">TCB Building, KN 48 St<br />Kigali, Rwanda</span></span>
            </a>
            <a href="https://instagram.com/ifix.electronics" target="_blank" rel="noopener noreferrer" aria-label="IFIX on Instagram" className="mt-5 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
              <SiInstagram className="h-4 w-4" /> @ifix.electronics <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#b4a8e3]">Contact</h3>
            <ul className="space-y-4 text-sm text-white/75">
              <li className="flex items-start gap-3"><span className="rounded-lg bg-white/10 p-2 text-[#00b2bd]"><SiWhatsapp className="h-4 w-4" /></span><a href="https://wa.me/250788442127" target="_blank" rel="noopener noreferrer" className="pt-2 hover:text-white">+250 788 442 127</a></li>
              <li className="flex items-start gap-3"><span className="rounded-lg bg-white/10 p-2 text-[#00b2bd]"><Phone className="h-4 w-4" /></span><a href="tel:+250788442127" className="pt-2 hover:text-white">Call +250 788 442 127</a></li>
              <li className="flex items-start gap-3"><span className="rounded-lg bg-white/10 p-2 text-violet-300"><Mail className="h-4 w-4" /></span><a href="mailto:ifixelectronics@gmail.com" className="break-all pt-2 hover:text-white">ifixelectronics@gmail.com</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#b4a8e3]"><Clock3 className="h-4 w-4" /> Store hours</h3>
            <div className="rounded-2xl border border-white/15 bg-slate-950/25 p-4 backdrop-blur-sm">
              <div className="flex justify-between gap-3 py-2 text-sm"><span className="text-white/65">Mon – Fri</span><span className="font-semibold">8:00 AM – 9:00 PM</span></div>
              <div className="flex justify-between gap-3 border-t border-white/10 py-2 text-sm"><span className="text-white/65">Saturday</span><span className="font-semibold">9:00 AM – 8:00 PM</span></div>
              <div className="flex justify-between gap-3 border-t border-white/10 py-2 text-sm"><span className="text-white/65">Sunday</span><span className="font-semibold text-rose-300">Closed</span></div>
              <p className="mt-1 border-t border-white/10 pt-3 text-xs text-white/55">Local time: CAT (GMT+2)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 IFIX. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/terms" className={linkClass}>Terms &amp; Privacy</Link>
            <a href="https://ysota.cloud/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-white">Powered by <span className="font-semibold text-white">YSOTA Cloud</span><ArrowUpRight className="h-3 w-3" /></a>
            <span className="inline-flex items-center gap-1.5 text-white/50"><ShieldCheck className="h-3.5 w-3.5" /> Secure shopping</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
