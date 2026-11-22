'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Mail, MessageSquare, Send } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { buildContactMailto, getContactEmail } from '../../lib/contact';

export default function ContactPage() {
  const recipient = getContactEmail();
  const [status, setStatus] = useState('');
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recipient) return;
    const fields = new FormData(event.currentTarget);
    window.location.href = buildContactMailto(recipient, {
      name: String(fields.get('name') || ''),
      email: String(fields.get('email') || ''),
      subject: String(fields.get('subject') || ''),
      message: String(fields.get('message') || ''),
    });
    setStatus('Email draft requested. Review and send it in your email app. ATHLIX has not sent a message.');
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="max-w-3xl mb-12">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-accent border border-accent/30 rounded-full px-4 py-2 mb-6"><MessageSquare className="w-4 h-4" /> Talk to the project team</p>
          <h1 className="text-4xl md:text-6xl font-extrabold font-display tracking-tight mb-5">Start with a <span className="text-gradient-accent">real workflow.</span></h1>
          <p className="text-lg text-text-secondary leading-relaxed">Discuss a karate club pilot, organizer access, or a product issue. Pilot availability and response times are not guaranteed.</p>
        </div>
        <div className="grid lg:grid-cols-5 gap-7">
          <aside className="lg:col-span-2 rounded-2xl border border-border bg-surface p-7 space-y-6">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><Mail className="w-6 h-6 text-accent" /></div>
            <h2 className="text-xl font-bold">Choose a contact path</h2>
            <p className="text-sm text-text-secondary leading-relaxed">The project repository accepts public issues. Do not include private account data, videos, credentials, or sensitive personal information.</p>
            <a href="https://github.com/pratikcoder01/Athlix/issues/new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-accent underline underline-offset-4">Open a GitHub issue<ArrowUpRight className="w-4 h-4" /></a>
            <p className="text-sm text-text-secondary leading-relaxed">For privacy and service-policy status, read the <Link href="/privacy" className="text-accent underline">privacy notice</Link> and <Link href="/terms" className="text-accent underline">terms notice</Link>. Both are pending legal review.</p>
          </aside>
          <section className="lg:col-span-3 rounded-2xl border border-border bg-surface p-7">
            <h2 className="text-xl font-bold mb-3">Prepare an email</h2>
            {recipient ? <p className="text-sm text-text-secondary mb-6">This opens a draft addressed to {recipient}. You must send it yourself in your email app.</p> : <p role="status" className="p-4 border border-amber-400/30 rounded-xl text-sm text-text-secondary mb-6">Email contact is not configured for this build. Use the public project issue link for non-sensitive questions. This form cannot send a message.</p>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <fieldset disabled={!recipient} className="space-y-5 disabled:opacity-50">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label htmlFor="contact-name" className="block text-sm font-semibold mb-2">Name</label><input id="contact-name" name="name" required maxLength={120} autoComplete="name" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-2 focus:outline-accent" /></div>
                  <div><label htmlFor="contact-email" className="block text-sm font-semibold mb-2">Reply email</label><input id="contact-email" name="email" type="email" required maxLength={254} autoComplete="email" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-2 focus:outline-accent" /></div>
                </div>
                <div><label htmlFor="contact-subject" className="block text-sm font-semibold mb-2">Subject</label><input id="contact-subject" name="subject" required maxLength={160} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-2 focus:outline-accent" /></div>
                <div><label htmlFor="contact-message" className="block text-sm font-semibold mb-2">Message</label><textarea id="contact-message" name="message" required maxLength={3000} rows={5} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-2 focus:outline-accent" /></div>
                <button type="submit" className="inline-flex items-center justify-center gap-2 w-full bg-accent text-white rounded-full px-5 py-3 font-bold disabled:cursor-not-allowed"><Send className="w-4 h-4" />Open Email Draft</button>
              </fieldset>
            </form>
            <p role="status" aria-live="polite" className="mt-4 text-sm text-text-secondary">{status}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
