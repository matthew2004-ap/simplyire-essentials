"use client";
import Link from "next/link";
import { FormEvent } from "react";
export default function Login(){function submit(e:FormEvent){e.preventDefault(); alert("Connect this form to /api/auth/login during backend setup.");} return <div className="auth-page"><form className="auth-card" onSubmit={submit}><span className="eyebrow">Welcome back</span><h1>Sign in</h1><label>Email<input type="email" required /></label><label>Password<input type="password" required /></label><button className="btn btn-primary full">Sign in</button><p>New here? <Link href="/register">Create an account</Link></p></form></div>}
