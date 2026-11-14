import Link from 'next/link';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';

export default function PolicyStatusPage() {
  return <div className="min-h-screen bg-background text-text-primary"><Navbar /><main className="max-w-3xl mx-auto px-4 pt-36 pb-24"><p className="text-sm font-semibold text-amber-400 mb-5">Draft placeholder · Legal review pending</p><h1 className="text-4xl font-bold font-display mb-6">Privacy notice</h1><p className="text-text-secondary leading-relaxed mb-5">This development project has not published a reviewed, complete privacy policy. This page records that limitation and does not claim legal approval, regulatory compliance, or a commercial service commitment.</p><p className="text-text-secondary leading-relaxed mb-5">Before using real customer data, the project team must confirm its data-handling details, support contact, retention practices, and the policies that apply to the pilot. Avoid sharing sensitive personal information or third-party videos in the meantime.</p><p className="text-text-secondary leading-relaxed mb-8">Some screens contain sample content. Paid subscriptions and online payment collection are unavailable.</p><Link href="/contact" className="text-accent underline underline-offset-4">View available project contact paths</Link></main><Footer /></div>;
}
