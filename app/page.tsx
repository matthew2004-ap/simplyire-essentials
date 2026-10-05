import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Newsletter from "@/components/Newsletter";
import { getFeaturedProducts } from "@/lib/products";

export default async function Home() {
  const featured = await getFeaturedProducts(4);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker">Your one-stop shop for girly essentials ✨</span>
            <h1>Self-care.<br /><em>Beauty.</em><br />Confidence.</h1>
            <p>All the little things you love, in one place. Discover fragrances, lip care, skincare, bags, accessories and everyday treats.</p>
            <div className="hero-actions">
              <Link href="/shop" className="btn btn-primary">Shop our products</Link>
              <Link href="/about" className="btn btn-light">Our story</Link>
            </div>
            <div className="hero-points"><span>✓ Quality you can trust</span><span>✓ Prices you&apos;ll love</span></div>
          </div>
          <div className="hero-collage">
            <div className="collage-main"><img src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85" alt="Fashion and lifestyle collection" /></div>
            <div className="collage-small"><img src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&q=85" alt="Beauty skincare products" /></div>
            <div className="round-stamp"><strong>SIMPLYIRE</strong><span>quality<br />you can trust</span>♥</div>
          </div>
        </div>
      </section>

      <section className="category-strip">
        <div className="container category-grid">
          {[
            ["Perfumes", "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=500&q=80"],
            ["Lip Care", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=500&q=80"],
            ["Skincare", "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=500&q=80"],
            ["Bags", "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=500&q=80"]
          ].map(([name, image]) => (
            <Link href={`/shop?category=${name}`} className="category-card" key={name}>
              <img src={image} alt={name} /><span>{name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-heading"><div><span className="eyebrow">Curated for you</span><h2>Our favourites</h2></div><Link href="/shop" className="text-link">View all products →</Link></div>
        <div className="product-grid">{featured.map(p => <ProductCard key={p.id} product={p} />)}</div>
      </section>

      <section className="story-band">
        <div className="container story-grid">
          <div><span className="eyebrow">Why Simplyire?</span><h2>Because the little things matter.</h2><p>We believe self-care doesn&apos;t have to be complicated or expensive. Simplyire brings together useful, beautiful and confidence-boosting essentials in one easy-to-shop space.</p><Link href="/about" className="btn btn-light">Meet Simplyire</Link></div>
          <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85" alt="Jewelry and lifestyle details" />
        </div>
      </section>

      <Newsletter />
    </>
  );
}
