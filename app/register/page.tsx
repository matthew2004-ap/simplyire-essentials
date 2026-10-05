"use client";
import Link from "next/link";
import { FormEvent } from "react";
export default function Register(){function submit(e:FormEvent){e.preventDefault(); alert("Connect this form to /api/auth/register during backend setup.");} return <div className="auth-page"><form className="auth-card" onSubmit={submit}><span className="eyebrow">Join Simplyire</span><h1>Create account</h1><label>Full name<input required /></label><label>Email<input type="email" required /></label><label>Password<input type="password" minLength={8} required /></label><button className="btn btn-primary full">Create account</button><p>Already have an account? <Link href="/login">Sign in</Link></p></form></div>}
