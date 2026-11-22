const focus = [
  { value: 'Karate', label: 'Proposed first discipline' },
  { value: 'Clubs', label: 'Proposed pilot customers' },
  { value: 'Events', label: 'Workflow to validate' },
  { value: 'Feedback', label: 'Experimental pose analysis' },
];

export default function StatsBar() {
  return (
    <section aria-label="Product focus" className="relative z-10 border-y border-border/70 bg-secondary/35 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {focus.map((item) => <div key={item.label} className="px-4 py-5 bg-background/45 border border-border rounded-sm"><span className="text-2xl sm:text-4xl font-display font-black tracking-tight text-text-primary">{item.value}</span><p className="text-xs text-text-secondary mt-3">{item.label}</p></div>)}
      </div>
    </section>
  );
}
