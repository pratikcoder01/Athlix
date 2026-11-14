import Link from 'next/link';
import { ArrowRight, Check, Shield, Trophy, Users } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';

const paths = [
  { name: 'Athlete', icon: Shield, status: 'Account registration', description: 'Create an athlete account to explore the configured development build.', details: ['Account and profile foundation', 'Event registration where an organizer has set up an event', 'Some screens still contain sample content'], href: '/signup', action: 'Create Athlete Account' },
  { name: 'Coach & Academy', icon: Users, status: 'Approval required', description: 'Professional privileges require review. A complete academy operating workflow is still in development.', details: ['Discuss your club workflow with the project team', 'Review current booking and directory limitations', 'No subscription entitlement is sold here'], href: '/contact', action: 'Discuss a Club Pilot' },
  { name: 'Tournament Organizer', icon: Trophy, status: 'Pilot scope', description: 'Explore a supervised event pilot with approved organizer access and a configured backend.', details: ['Event setup and athlete registration', 'Organizer-managed bracket updates', 'Payment collection is unavailable'], href: '/contact', action: 'Discuss an Event Pilot' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent mb-6">Pilot access · Commercial terms pending</p>
          <h1 className="text-4xl md:text-6xl font-extrabold font-display tracking-tight mb-5">Build the right <span className="text-gradient-accent">first pilot.</span></h1>
          <p className="text-lg text-text-secondary leading-relaxed">Paid subscriptions, checkout, and automatic billing are not available. Pricing and service commitments have not been finalized.</p>
        </div>
        <section aria-label="Access options" className="grid md:grid-cols-3 gap-6">
          {paths.map(({ name, icon: Icon, status, description, details, href, action }) => (
            <article key={name} className="flex flex-col p-7 rounded-2xl border border-border bg-surface">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5"><Icon className="w-5 h-5 text-accent" /></div>
              <p className="text-xs text-accent font-semibold mb-2">{status}</p>
              <h2 className="text-2xl font-bold font-display mb-3">{name}</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">{description}</p>
              <ul className="space-y-3 mb-8 flex-1">{details.map((detail) => <li key={detail} className="flex gap-2 text-sm text-text-secondary"><Check className="w-4 h-4 mt-0.5 shrink-0 text-accent" />{detail}</li>)}</ul>
              <Link href={href} className="inline-flex justify-center items-center gap-2 py-3 px-4 rounded-full border border-accent/40 text-sm font-bold hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4">{action}<ArrowRight className="w-4 h-4" /></Link>
            </article>
          ))}
        </section>
        <section className="max-w-3xl mx-auto mt-16 space-y-4" aria-labelledby="pricing-questions">
          <h2 id="pricing-questions" className="text-2xl font-bold mb-6">Before you begin</h2>
          {[
            ['Will I be charged?', 'This application has no implemented paid checkout or subscription billing. Do not send card details or make a payment through a sample screen.'],
            ['Is there a trial period?', 'No timed trial or permanent free-plan promise is offered. Development access and any future pilot agreement are separate from a paid service.'],
            ['Can an academy buy a plan today?', 'No purchasable academy plan is available. Contact the project team to discuss scope, readiness, data handling, and commercial terms first.'],
            ['Does professional access verify my qualifications?', 'A platform role grants application permissions. It does not certify coaching credentials, identity, sporting results, or safeguarding checks.'],
          ].map(([question, answer]) => <details key={question} className="p-5 rounded-2xl border border-border bg-surface"><summary className="font-semibold cursor-pointer focus-visible:outline-2 focus-visible:outline-accent">{question}</summary><p className="mt-3 text-sm text-text-secondary leading-relaxed">{answer}</p></details>)}
        </section>
      </main>
      <Footer />
    </div>
  );
}
