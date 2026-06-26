'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowUpRight, BookOpen, TrendingUp, Zap } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';

const articles = [
  {
    title: "How to Structure BJJ Training Schedules",
    desc: "A technical breakdown of organizing live rolling, technique drills, active recovery sessions, and rank stripe goals for the modern combat athlete.",
    date: "June 18, 2026",
    author: "Pratik",
    category: "Training Methodology",
    tag: "BJJ",
    cover: "/images/covers/blog-bjj-training.png",
    readTime: "8 min read",
    featured: true,
  },
  {
    title: "MMA Weight Logging & Proactive Analytics",
    desc: "How modern fighters track weight logs, metabolic output, and hydration levels during the final weeks of fight preparation for peak performance.",
    date: "May 29, 2026",
    author: "Kirat",
    category: "Sports Performance",
    tag: "MMA",
    cover: "/images/covers/blog-weight-logging.svg",
    readTime: "6 min read",
  },
  {
    title: "Double-Elimination Bracket Tree Mechanics",
    desc: "An engineering review of seed generation, match scheduling, and real-time updates in modern combat sports software tournament management.",
    date: "April 12, 2026",
    author: "Anuja",
    category: "Tournament Logistics",
    tag: "Wrestling",
    cover: "/images/covers/blog-bracket-mechanics.svg",
    readTime: "10 min read",
  },
  {
    title: "Recovery Protocols for High-Volume Grapplers",
    desc: "Evidence-based recovery techniques including contrast water therapy, active mobility drills, and nutrition timing for athletes training 5+ days per week.",
    date: "March 20, 2026",
    author: "Shravan",
    category: "Athlete Recovery",
    tag: "BJJ",
    cover: "/images/covers/blog-recovery-methods.svg",
    readTime: "7 min read",
  },
  {
    title: "Hydration Science for Combat Sports Competitors",
    desc: "How to safely manage cut weight, rehydration protocols post-weigh-in, and electrolyte strategies that maximize same-day performance in the bracket.",
    date: "February 8, 2026",
    author: "Pratik",
    category: "Sports Nutrition",
    tag: "MMA",
    cover: "/images/covers/blog-hydration-guide.svg",
    readTime: "5 min read",
  },
];

const tagColors: Record<string, string> = {
  BJJ: 'accent',
  MMA: 'default',
  Wrestling: 'success',
  Boxing: 'warning',
};

export default function BlogPage() {
  const [activeTag, setActiveTag] = useState('All');
  const tags = ['All', 'BJJ', 'MMA', 'Wrestling'];
  const filtered = activeTag === 'All' ? articles : articles.filter(a => a.tag === activeTag);

  const featured = filtered.find(a => a.featured) || filtered[0];
  const rest = filtered.filter(a => a !== featured);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <AnimatedBadge variant="accent" glow>
              <BookOpen className="w-3 h-3 mr-1.5" /> The Athlix Logs
            </AnimatedBadge>
          </motion.div>

          <AnimatedText
            text="Insights from the Mat"
            className="text-4xl md:text-6xl font-black tracking-tight mb-4"
            delay={0.1}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary text-lg max-w-2xl mx-auto"
          >
            Training methodology, performance science, and tournament logistics from our combat sports team.
          </motion.p>

          {/* Tag filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-3 mt-8 flex-wrap"
          >
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
                  activeTag === tag
                    ? 'bg-accent text-black border-accent shadow-lg shadow-accent/30'
                    : 'border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Featured Article */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <GlassCard padding="none" variant="interactive" className="group overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
                {/* Image */}
                <div className="relative h-64 lg:h-auto overflow-hidden bg-surface">
                  <img
                    src={featured.cover}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent lg:bg-gradient-to-l" />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <AnimatedBadge variant="accent" glow>
                      <Zap className="w-3 h-3 mr-1" /> Featured
                    </AnimatedBadge>
                    <AnimatedBadge variant={tagColors[featured.tag] as any || 'default'}>
                      {featured.tag}
                    </AnimatedBadge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-between">
                  <div>
                    <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">
                      {featured.category}
                    </p>
                    <h2 className="text-2xl lg:text-3xl font-black mb-4 leading-tight group-hover:text-accent transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-text-secondary leading-relaxed mb-6">
                      {featured.desc}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-6 text-sm text-text-tertiary mb-6">
                      <span className="flex items-center gap-2"><User className="w-4 h-4" />{featured.author}</span>
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{featured.date}</span>
                      <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />{featured.readTime}</span>
                    </div>
                    <button className="group/btn flex items-center gap-2 text-accent font-semibold hover:gap-3 transition-all">
                      Read Article <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((article, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx + 0.3 }}
            >
              <GlassCard padding="none" variant="interactive" className="h-full flex flex-col group overflow-hidden">
                {/* Cover */}
                <div className="relative h-48 overflow-hidden bg-surface">
                  <img
                    src={article.cover}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.parentElement!.style.background = 'linear-gradient(135deg, hsl(220 15% 12%), hsl(220 20% 8%))';
                      el.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <AnimatedBadge variant={tagColors[article.tag] as any || 'default'}>
                      {article.tag}
                    </AnimatedBadge>
                  </div>
                  <div className="absolute bottom-4 left-4 text-xs text-text-tertiary font-mono">
                    {article.readTime}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-accent text-[10px] font-bold uppercase tracking-widest mb-2">{article.category}</p>
                  <h3 className="text-lg font-bold mb-3 leading-tight group-hover:text-accent transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
                    {article.desc}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                    <div className="flex items-center gap-3 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{article.author}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{article.date}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20"
        >
          <GlassCard variant="glow" padding="lg" className="text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <AnimatedBadge variant="accent" glow className="mb-4">
                <Zap className="w-3 h-3 mr-1" /> Stay Sharp
              </AnimatedBadge>
              <h2 className="text-2xl md:text-3xl font-black mb-3">Weekly Training Intel</h2>
              <p className="text-text-secondary mb-8 max-w-lg mx-auto">
                Get the latest training methodologies, tournament results, and performance science delivered to your inbox every Monday.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
                <button className="bg-accent text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
