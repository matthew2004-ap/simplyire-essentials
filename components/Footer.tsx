"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand footer-brand">
            <span className="brand-script">Simplyire</span>
            <span className="brand-sub">ESSENTIALS</span>
          </Link>
          <p>Self-care, beauty and everyday essentials curated to make the little things feel special.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link href="/shop">Shop all</Link>
          <Link href="/about">Our story</Link>
          <Link href="/services">Services</Link>
          <Link href="/blog">Journal</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link href="/contact">Contact us</Link>
          <Link href="/shipping">Shipping & returns</Link>
          <Link href="/faq">FAQs</Link>
        </div>
        <div>
          <h4>Stay in the know</h4>
          <p>New drops, self-care ideas and special offers.</p>
          <div className="footer-socials">
            <span>Instagram</span><span>WhatsApp</span><span>TikTok</span>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {currentYear} Simplyire Essentials. All rights reserved.</span>
        <span>Made with care in Nigeria 🇳🇬</span>
      </div>
    </footer>
  );
}
