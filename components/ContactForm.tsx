"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries()))
      });
    } catch {}
    setLoading(false);
    setSent(true);
  }

  if (sent) return <div className="form-success"><h3>Message received 💗</h3><p>Thank you. We&apos;ll get back to you as soon as possible.</p></div>;

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-two">
        <label>Name<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
      </div>
      <label>Subject<input name="subject" required /></label>
      <label>Message<textarea name="message" rows={7} required /></label>
      <button className="btn btn-primary" disabled={loading}>{loading ? "Sending..." : "Send message"}</button>
    </form>
  );
}
