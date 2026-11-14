import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, Shield, Trophy } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';

const notes = [
  { icon: Trophy, title: 'A focused first pilot', body: 'ATHLIX is exploring a karate-club and local-event workflow: an approved organizer creates an event, athletes register, and the organizer manages brackets. Customer demand and pilot geography still need validation. Broader sports coverage is a direction rather than a launch promise.' },
  { icon: Brain, title: 'What a kata score can tell you', body: 'The analyzer estimates 2D body landmarks and applies movement rules. Camera angle, framing, clothing, and landmark confidence can change the result. A score is not a measurement of force, an official competition result, or a medical assessment. Review feedback with a qualified coach.' },
  { icon: Shield, title: 'Professional access needs review', body: 'Public registration creates an athlete account. Professional privileges need a trusted approval process. Application permissions do not certify coaching qualifications or verify a sporting achievement. Some development screens contain sample profiles and statistics.' },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="max-w-3xl mb-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-accent mb-6"><BookOpen className="w-4 h-4" /> Product notes</p>
          <h1 className="text-4xl md:text-6xl font-extrabold font-display tracking-tight mb-5">From the <span className="text-gradient-accent">work in progress.</span></h1>
          <p className="text-lg text-text-secondary leading-relaxed">A clear account of what we are building and what remains to be proven. A newsletter is not currently available.</p>
        </div>
        <div className="space-y-6">
          {notes.map(({ icon: Icon, title, body }) => <article key={title} className="p-7 md:p-9 rounded-2xl border border-border bg-surface"><Icon className="w-6 h-6 text-accent mb-5" /><h2 className="text-2xl font-bold mb-4">{title}</h2><p className="text-text-secondary leading-relaxed max-w-4xl">{body}</p></article>)}
        </div>
        <Link href="/features" className="inline-flex gap-2 items-center text-accent font-semibold mt-10 underline underline-offset-4">Review product status<ArrowRight className="w-4 h-4" /></Link>
      </main>
      <Footer />
    </div>
  );
}
