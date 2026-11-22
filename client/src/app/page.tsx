'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, Check, ChevronDown, CornerDownRight, ScanLine, Trophy } from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import KataTelemetryPreview from '../components/landing/KataTelemetryPreview';
import { cn } from '../lib/utils';

const primaryLink = 'inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';
const secondaryLink = 'inline-flex min-h-12 items-center justify-center gap-3 rounded-md border border-border-strong px-6 py-3 text-sm font-medium text-text-primary transition-colors hover:border-text-secondary hover:bg-surface';
const pageWidth = 'mx-auto w-full max-w-7xl px-5 sm:px-8';
const eyebrow = 'font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary';

const capabilities = [
  { n: '01', title: 'Academy workspace', href: '/academies', body: 'Listing details, private member records, daily attendance. One useful operational view for approved owners.' },
  { n: '02', title: 'Your training records', href: '/training', body: 'A private journal, saved plans and session history. Your own records, without a public performance leaderboard.' },
  { n: '03', title: 'Coaching sessions', href: '/coaches', body: 'Published rates and UTC availability, real session requests and booking management. Qualifications still need independent review.' },
  { n: '04', title: 'Professional access', href: '/contact', body: 'Public accounts begin as athletes. Coach, owner and organizer privileges follow a trusted review process.' },
];
const steps = [
  { n: '01', title: 'Start with an account', detail: 'Create an athlete account to keep your profile and training records together. Public signup does not grant professional privileges.', href: '/signup', link: 'Create an athlete account' },
  { n: '02', title: 'Know the product status', detail: 'Separate saved workflows from illustrative previews and experimental feedback. Review the product boundaries before planning your pilot.', href: '/features', link: 'Read the product status' },
  { n: '03', title: 'Set up a club pilot', detail: 'Discuss a narrow karate-club or local-event workflow with the project team. Customer demand, geography and operating support still need validation.', href: '/contact', link: 'Discuss a club pilot' },
  { n: '04', title: 'Review access', detail: 'Professional accounts require approval before managing a club or event. A platform role does not certify coaching qualifications or sporting credentials.', href: '/contact', link: 'Ask about professional access' },
  { n: '05', title: 'Use real event data', detail: 'An approved organizer can configure divisions, receive athlete registrations and manage versioned brackets and results. Entry-fee collection remains outside ATHLIX.', href: '/tournaments', link: 'Explore tournaments' },
  { n: '06', title: 'Share feedback', detail: 'Test a focused workflow and report where it helps or gets in the way. Use permissioned data and agree operating responsibilities before wider use.', href: '/contact', link: 'Share pilot feedback' },
];
const principles = [
  ['Access controls', 'Protected actions check the current account, role and ownership. No security certification is claimed.'],
  ['Realtime event updates', 'Authenticated channels provide refresh hints; saved event records remain the source of truth.'],
  ['A narrow karate-first market', 'Karate clubs and local organizers are the proposed starting point. Customer demand still needs to be tested.'],
  ['Evidence before numbers', 'No invented customer counts, testimonials or revenue. Report outcomes after they have been measured.'],
  ['Reviewed privileges', 'Professional access needs approval. A platform role is not proof of sporting qualifications.'],
];
const calculations = ['Joint-angle estimates', 'Body-center proxy', 'Stability and symmetry', 'Observed guard position', 'Landmark velocity', 'Relative stance width'];
const limitations = ['True 3D position', 'Physical impact force', 'Fine-grained kata names', 'Weight distribution'];
const faqs = [
  { q: 'Who is ATHLIX being built for?', a: 'Our proposed first pilot is karate academies and local tournament organizers. The initial geography and customer demand still need validation; broader combat-sports support is a roadmap direction.' },
  { q: 'Is every screen ready for real customers?', a: 'This is a development pilot. Account workspaces use saved records; illustrative product mockups are labeled. Broader hosted qualification, reviewed policies and operating support are still needed before a public release.' },
  { q: 'What does the Kata Analyzer measure?', a: 'It estimates body landmarks from monocular video and calculates movement heuristics. It cannot measure physical force, diagnose injuries or certify performance. No independently validated accuracy figure is available.' },
  { q: 'Are subscriptions or payments available?', a: 'No. Paid plans, checkout and automated billing are not available. Pilot scope and commercial terms must be discussed with the team.' },
  { q: 'What should I know before sharing data?', a: 'Privacy and service terms are pending legal review. Avoid uploading sensitive or third-party information. Use only videos you have permission to share, and review the analyzer consent notice.' },
];

function Status({ children, experimental = false }: { children: ReactNode; experimental?: boolean }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-subtle px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-text-secondary"><span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', experimental ? 'bg-status-experimental' : 'bg-status-active')} />{children}</span>;
}
function SectionHeading({ index, label, title, children }: { index: string; label: string; title: string; children?: ReactNode }) {
  return <div className="mb-10 grid gap-5 lg:grid-cols-12 lg:items-end">
    <div className="lg:col-span-8"><p className={eyebrow}>{index} / {label}</p><h2 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-[1.15] tracking-[-0.025em] sm:text-4xl">{title}</h2></div>
    {children && <p className="max-w-prose text-sm leading-relaxed text-text-secondary lg:col-span-4">{children}</p>}
  </div>;
}
function WorkflowStepper() {
  const [active, setActive] = useState(0);
  const current = steps[active];
  return <div>
    <p className="mb-7 text-sm text-text-secondary">Select a step to see what it involves.</p>
    <ol aria-label="Pilot workflow" className="relative grid border-l border-border md:grid-cols-6 md:border-l-0 md:border-t">
      {steps.map((step, index) => <li key={step.n} className="relative min-w-0 md:pr-5">
        <button id={'pilot-step-' + step.n} type="button" aria-pressed={active === index} aria-controls="pilot-step-details" onClick={() => setActive(index)} className="group flex min-h-16 w-full items-start gap-4 py-4 pl-5 text-left md:block md:py-6 md:pl-0">
          <span aria-hidden="true" className={cn('absolute -left-[3px] top-6 h-1.5 w-1.5 rounded-full md:-top-[3px] md:left-0', active === index ? 'bg-accent' : 'bg-border-strong')} />
          <span className={cn('font-mono text-xs tabular-nums transition-colors md:mb-4 md:block', active === index ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary')}>{step.n}</span>
          <span className={cn('block text-sm font-medium leading-snug transition-colors', active === index ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary')}>{step.title}</span>
        </button>
      </li>)}
    </ol>
    <div id="pilot-step-details" role="region" aria-labelledby={'pilot-step-' + current.n} className="mt-5 grid gap-6 border-y border-border py-7 sm:grid-cols-[8rem_1fr] lg:grid-cols-[10rem_1fr_15rem] lg:items-center">
      <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Step <span className="tabular-nums text-text-primary">{current.n}</span> / 06</p>
      <div><h3 className="font-display text-xl font-semibold tracking-tight">{current.title}</h3><p className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">{current.detail}</p></div>
      <Link href={current.href} className="inline-flex min-h-11 items-center gap-3 text-sm font-medium text-text-primary sm:col-start-2 lg:col-start-auto lg:justify-self-end">{current.link}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link>
    </div>
  </div>;
}
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  return <div className="divide-y divide-border border-y border-border">
    {faqs.map((faq, index) => <div key={faq.q}>
      <h3><button id={'faq-question-' + index} type="button" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} aria-controls={'faq-answer-' + index} className="flex min-h-20 w-full items-center justify-between gap-6 py-5 text-left text-base font-medium">
        {faq.q}<ChevronDown aria-hidden="true" className={cn('h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 motion-reduce:transition-none', open === index && 'rotate-180')} />
      </button></h3>
      <motion.div id={'faq-answer-' + index} role="region" aria-labelledby={'faq-question-' + index} aria-hidden={open !== index} initial={false} animate={{ height: open === index ? 'auto' : 0, opacity: open === index ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
        <p className="max-w-prose pb-6 pr-8 text-sm leading-relaxed text-text-secondary">{faq.a}</p>
      </motion.div>
    </div>)}
  </div>;
}

export default function Home() {
  return <div className="min-h-screen bg-background text-text-primary">
    <Navbar announcement />
    <main>
      <section aria-labelledby="hero-heading" className="pb-20 pt-40 lg:pb-28 lg:pt-48">
        <div className={cn(pageWidth, 'grid items-center gap-12 lg:grid-cols-12 lg:gap-10')}>
          <div className="min-w-0 lg:col-span-7 lg:pr-5">
            <p className={eyebrow}>Combat sports development pilot</p>
            <h1 id="hero-heading" className="mt-6 max-w-3xl font-display text-[2.75rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-6xl lg:text-[4.5rem]">More time<br className="hidden sm:block" /> on the mat.</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-text-secondary">Athlete accounts, local tournament brackets, and experimental 2D kata feedback—built around a focused karate club pilot with clear engineering boundaries.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/signup" className={primaryLink}>Create Athlete Account<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              <Link href="#how" className={secondaryLink}>See How It Works<ArrowDown aria-hidden="true" className="h-4 w-4" /></Link>
            </div>
            <p className="mt-6 max-w-xl text-xs leading-relaxed text-text-secondary">Saved account workflows. Experimental analysis. No measured traction is claimed.</p>
            <div className="mt-9 border-t border-border pt-5">
              <p className="font-mono text-[10px] uppercase leading-loose tracking-[0.05em] text-text-secondary">Karate <span className="text-text-primary">(pilot focus)</span><span aria-hidden="true"> · </span>BJJ · Judo · Taekwondo · Boxing · Muay Thai</p>
              <p className="mt-1 text-xs text-text-secondary">Broader disciplines are a roadmap direction, not equivalent feature coverage.</p>
            </div>
          </div>
          <div className="min-w-0 lg:col-span-5"><KataTelemetryPreview /></div>
        </div>
      </section>

      <section id="features" aria-label="Platform overview" className="border-t border-border py-16 sm:py-20">
        <div className={pageWidth}>
          <SectionHeading index="01" label="The platform" title="Two focused tools. One useful club workflow.">From the individual session to the local event. Implemented workflows and experimental feedback are labeled separately.</SectionHeading>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4"><ScanLine aria-hidden="true" className="h-6 w-6 text-text-secondary" /><Status experimental>Experimental</Status></div>
              <h3 className="mt-7 font-display text-2xl font-semibold tracking-tight">Kata analysis</h3>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-text-secondary">2D pose estimation, joint-angle estimates and rule-based stance and movement feedback. Camera angle and landmark confidence affect what can be observed.</p>
              <dl className="my-7 divide-y divide-border border-y border-border font-mono text-[11px]">
                <div className="flex justify-between gap-4 py-3"><dt className="text-text-secondary">INPUT</dt><dd>Consented monocular video</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-text-secondary">SIGNALS</dt><dd>Angles / relative motion</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-text-secondary">CONFIDENCE</dt><dd>Unseen components unscored</dd></div>
              </dl>
              <p className="mb-5 text-xs leading-relaxed text-text-secondary">Hosted availability depends on service configuration. No validated skill or accuracy measure is claimed.</p>
              <Link href="/kata" className="mt-auto inline-flex min-h-11 items-center gap-3 text-sm font-medium">Review the analyzer<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </article>
            <article className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4"><Trophy aria-hidden="true" className="h-6 w-6 text-text-secondary" /><Status experimental>Pilot scope</Status></div>
              <h3 className="mt-7 font-display text-2xl font-semibold tracking-tight">Tournaments</h3>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-text-secondary">Authenticated athlete registration and organizer-managed divisions, brackets and results. Saved state and version checks govern each transition.</p>
              <div className="my-7 rounded-md border border-border bg-background p-4">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-secondary">Illustrative bracket · not a real event</p>
                <div className="grid grid-cols-[1fr_1.5rem_1fr] items-center text-xs sm:grid-cols-[1fr_2rem_1fr]">
                  <div className="space-y-2"><div className="border border-border-strong px-3 py-2.5">Entrant A</div><div className="border border-border-strong px-3 py-2.5">Entrant B</div></div>
                  <div aria-hidden="true" className="relative h-12 border-y border-r border-border-strong after:absolute after:left-full after:top-1/2 after:w-3 after:border-t after:border-border-strong" />
                  <div className="ml-3 border border-border-strong px-3 py-3 font-mono text-[10px] leading-relaxed text-text-secondary">Organizer<br />records result</div>
                </div>
              </div>
              <p className="mb-5 text-xs leading-relaxed text-text-secondary">Local-event scope. Entry fees and refunds remain outside ATHLIX.</p>
              <Link href="/tournaments" className="mt-auto inline-flex min-h-11 items-center gap-3 text-sm font-medium">Explore tournaments<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </article>
          </div>
          <div className="mt-6 grid overflow-hidden rounded-xl border border-border bg-surface md:grid-cols-2">
            {capabilities.map((capability, index) => <Link key={capability.n} href={capability.href} className={cn('group min-w-0 p-6 transition-colors hover:bg-surface-subtle sm:p-8', index > 0 && 'border-t border-border', index === 1 && 'md:border-t-0', index % 2 === 1 && 'md:border-l')}>
              <div className="flex items-center justify-between gap-4"><span className="font-mono text-[10px] text-text-secondary">{capability.n} / SUPPORTING WORKFLOW</span><ArrowRight aria-hidden="true" className="h-4 w-4 text-text-secondary transition-transform group-hover:translate-x-1 motion-reduce:transform-none" /></div>
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{capability.title}{index === 3 && <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-wide text-text-secondary">Reviewed</span>}</h3>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-text-secondary">{capability.body}</p>
            </Link>)}
          </div>
        </div>
      </section>

      <section id="how" aria-labelledby="workflow-heading" className="border-t border-border py-16 sm:py-20">
        <div className={pageWidth}>
          <p className={eyebrow}>02 / The workflow</p><h2 id="workflow-heading" className="mb-9 mt-4 max-w-2xl font-display text-3xl font-bold leading-[1.15] tracking-[-0.025em] sm:text-4xl">A useful pilot starts with a clear process.</h2>
          <WorkflowStepper />
        </div>
      </section>

      <section aria-label="Engineering and measurement transparency" className="border-t border-border py-16 sm:py-20">
        <div className={pageWidth}>
          <SectionHeading index="03" label="Engineering, in plain sight" title="Know the system. Know its limits.">Pilot principles and measurement boundaries belong in the product, not in the fine print.</SectionHeading>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div><h3 className="mb-5 font-display text-xl font-semibold">Pilot architecture &amp; trust</h3><dl className="divide-y divide-border border-y border-border">{principles.map(([title, detail], index) => <div key={title} className="relative py-5 pl-10"><dt className="text-sm font-semibold"><span aria-hidden="true" className="absolute left-0 pt-0.5 font-mono text-[10px] font-normal text-text-secondary">0{index + 1}</span>{title}</dt><dd className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">{detail}</dd></div>)}</dl></div>
            <div className="self-start rounded-xl border border-border bg-surface">
              <div className="border-b border-border p-6 sm:p-7"><p className={eyebrow}>Measurement specification</p><h3 className="mt-3 font-display text-xl font-semibold">Kata Analyzer boundaries</h3><p className="mt-3 text-sm leading-relaxed text-text-secondary">Estimated landmarks support interpretable movement heuristics. They do not replace a qualified coach or a physical measurement system.</p></div>
              <div className="grid sm:grid-cols-2">
                <div className="p-6 sm:border-r sm:border-border sm:p-7"><h4 className="mb-5 font-mono text-[10px] font-medium uppercase tracking-wider text-text-secondary">What it calculates</h4><ul className="space-y-3">{calculations.map(item => <li key={item} className="flex items-start gap-2.5 text-sm"><Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-secondary" />{item}</li>)}</ul></div>
                <div className="border-t border-border p-6 sm:border-t-0 sm:p-7"><h4 className="mb-5 font-mono text-[10px] font-medium uppercase tracking-wider text-text-secondary">What it does not measure</h4><ul className="space-y-3">{limitations.map(item => <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary"><span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-border-strong" />{item}</li>)}</ul></div>
              </div>
              <p className="border-t border-border px-6 py-5 text-xs leading-relaxed text-text-secondary sm:px-7">No independently validated accuracy figure. No injury diagnosis or performance certification. Use only videos you have permission to share.</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="border-t border-border py-16 sm:py-20">
        <div className={cn(pageWidth, 'grid gap-10 lg:grid-cols-12 lg:gap-16')}>
          <div className="lg:col-span-4"><p className={eyebrow}>04 / Before you begin</p><h2 id="faq-heading" className="mt-4 font-display text-3xl font-bold leading-[1.15] tracking-[-0.025em] sm:text-4xl">Questions,<br className="hidden lg:block" /> answered.</h2><p className="mt-5 max-w-prose text-sm leading-relaxed text-text-secondary">A development pilot should make its scope easy to understand.</p></div>
          <div className="lg:col-span-8"><FAQ /></div>
        </div>
      </section>

      <section aria-labelledby="closing-heading" className={cn(pageWidth, 'pb-20 pt-4')}>
        <div className="grid items-center gap-8 rounded-2xl border border-border bg-surface p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:p-14">
          <div><p className={eyebrow}>Your next step</p><h2 id="closing-heading" className="mt-4 max-w-xl font-display text-3xl font-bold leading-[1.15] tracking-[-0.025em] sm:text-4xl">A focused pilot.<br />A clear first step.</h2><p className="mt-5 max-w-prose text-sm leading-relaxed text-text-secondary">Create an athlete account, explore the saved workflows and help shape a useful karate-club pilot. Professional access requires review; checkout remains disabled.</p></div>
          <div className="flex flex-col items-start gap-4 lg:items-center"><Link href="/signup" className={primaryLink}>Create Athlete Account<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link><Link href="/features" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary">View Product Status<CornerDownRight aria-hidden="true" className="h-4 w-4" /></Link></div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
