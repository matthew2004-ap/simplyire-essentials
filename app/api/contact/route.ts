import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;
    if (!name || !email || !subject || !message) return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    const saved = await db.contactMessage.create({ data: { name, email, subject, message } });
    return NextResponse.json({ ok: true, id: saved.id });
  } catch {
    return NextResponse.json({ error: "Database is not connected yet. Complete the backend setup." }, { status: 503 });
  }
}
