"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Contact" }
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="announcement">✨ Little things. Big confidence. Free delivery on selected orders.</div>
      <nav className="nav container">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-script">Simplyire</span>
          <span className="brand-sub">ESSENTIALS</span>
        </Link>

        <button className="menu-btn" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          {open ? "×" : "☰"}
        </button>

        <div className={`nav-links ${open ? "open" : ""}`}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/cart" className="nav-cart" onClick={() => setOpen(false)}>Bag <span>0</span></Link>
        </div>
      </nav>
    </header>
  );
}
