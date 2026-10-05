import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return <div className="page"><section className="page-hero"><div className="container"><span className="eyebrow">Get in touch</span><h1>We&apos;d love to hear from you.</h1><p>Questions about a product, an order, gifting or a partnership? Send us a message.</p></div></section><section className="section container contact-grid"><div><span className="eyebrow">Contact details</span><h2>Let&apos;s talk.</h2><div className="contact-detail"><strong>Email</strong><span>hello@simplyireessentials.com</span></div><div className="contact-detail"><strong>WhatsApp</strong><span>+234 000 000 0000</span></div><div className="contact-detail"><strong>Hours</strong><span>Mon – Sat · 9:00am – 6:00pm</span></div><p className="muted">Replace the placeholder contact details above with the brand&apos;s real information before launch.</p></div><ContactForm /></section></div>;
}
