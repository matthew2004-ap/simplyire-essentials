import "server-only";

import { db } from "@/lib/db";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function getProducts() {
  return db.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getFeaturedProducts(limit = 4) {
  return db.product.findMany({
    where: { featured: true },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
  });
}

export const categories = [
  "All",
  "Perfumes",
  "Beauty",
  "Skincare",
  "Bags & Accessories",
  "Self-Care",
  "Accessories",
];
