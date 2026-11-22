import type { ReactNode } from 'react';
import Link from 'next/link';
import Navbar from './Navbar';
import Footer from './Footer';
import { policyDraftDetails } from '../../lib/policyDraft';

export function PolicyDocument({ title, reviewStatus, children }: {
  title: string;
  reviewStatus: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main id="policy-content" className="mx-auto max-w-3xl px-4 pb-24 pt-36 sm:px-6">
        <header className="mb-10">
          <p className="mb-4 text-sm font-semibold">Draft · {reviewStatus}</p>
          <h1 className="mb-6 font-display text-4xl font-bold tracking-tight">{title}</h1>
          <div role="note" className="rounded-xl border border-border bg-surface p-5 leading-relaxed">
            <p className="font-semibold">For review before a real-data pilot</p>
            <p className="mt-2 text-text-secondary">This technical draft describes the development build. It is not a reviewed, complete policy or a statement of legal approval, regulatory compliance, or a commercial service commitment.</p>
            <p className="mt-2 text-sm text-text-secondary">Draft revision: <time dateTime={policyDraftDetails.revisionDate}>{policyDraftDetails.revisionDate}</time>. {policyDraftDetails.effectiveStatus}.</p>
          </div>
        </header>

        <aside aria-labelledby="sample-details-heading" className="mb-12 rounded-xl border border-border p-5">
          <h2 id="sample-details-heading" className="text-lg font-semibold">Editable SAMPLE details</h2>
          <p className="mb-5 mt-2 leading-relaxed text-text-secondary">The following examples must be replaced and verified by the project owner. They do not identify a real operator or a working support service.</p>
          <dl className="space-y-4 text-sm leading-relaxed">
            <div><dt className="font-semibold">Operator</dt><dd className="text-text-secondary">{policyDraftDetails.operatorName}</dd></div>
            <div><dt className="font-semibold">Operating country</dt><dd className="text-text-secondary">{policyDraftDetails.operatingCountry}</dd></div>
            <div><dt className="font-semibold">Support address example — inactive</dt><dd className="break-all text-text-secondary">{policyDraftDetails.supportEmail}</dd></div>
            <div><dt className="font-semibold">Proposed age example — unconfirmed</dt><dd className="text-text-secondary">SAMPLE — {policyDraftDetails.proposedMinimumAge}+. Registration currently has no age gate. This example does not enforce eligibility or establish a minors policy.</dd></div>
          </dl>
        </aside>

        <div className="space-y-10 text-text-secondary [&_p]:leading-relaxed [&_p+p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6 [&_li]:leading-relaxed [&_a]:[color:var(--brand-accent-text)] [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-4">
          {children}
        </div>
        <nav aria-label="Related policy and contact pages" className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-6 text-sm">
          <Link href="/privacy" className="text-accent underline underline-offset-4">Privacy draft</Link>
          <Link href="/terms" className="text-accent underline underline-offset-4">Terms draft</Link>
          <Link href="/contact" className="text-accent underline underline-offset-4">Available project contact paths</Link>
        </nav>
      </main>
      <Footer />
    </div>
  );
}

export function PolicySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-4 scroll-mt-28 text-2xl font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}
