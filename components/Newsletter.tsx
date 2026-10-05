"use client";

import { FormEvent, useState } from "react";

export default function Newsletter() {
  const [done, setDone] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setDone(true);
  }

  return (
    <section className="newsletter">
      <div>
        <span className="eyebrow">The Simplyire note</span>
        <h2>Little updates, lovely things.</h2>
        <p>Join our list for new arrivals, care tips and occasional treats.</p>
      </div>
      {done ? (
        <div className="success-box">You&apos;re on the list. 💗</div>
      ) : (
        <form onSubmit={submit} className="newsletter-form">
          <input type="email" required placeholder="Your email address" aria-label="Email address" />
          <button className="btn btn-dark">Join us</button>
        </form>
      )}
    </section>
  );
}
