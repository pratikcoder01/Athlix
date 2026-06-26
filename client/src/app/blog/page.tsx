'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Sparkles } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';

export default function BlogPage() {
  const articles = [
    {
      title: "How to Structure BJJ Training Schedules",
      desc: "A technical breakdown of organizing live rolling, technique drills, active recovery sessions, and rank stripe goals for the modern combat athlete.",
      date: "June 18, 2026",
      author: "Pratik",
      category: "TRAINING METHODOLOGY",
      tag: "BJJ",
      cover: "/images/covers/blog-bjj-training.png"
    },
    {
      title: "MMA Weight Logging & Proactive Analytics",
      desc: "How modern fighters track weight logs, metabolic output, and hydration levels during the final weeks of fight preparation for peak performance.",
      date: "May 29, 2026",
      author: "Kirat",
      category: "SPORTS PERFORMANCE",
      tag: "MMA",
      cover: "/images/covers/blog-weight-logging.svg"
    },
    {
      title: "Double-Elimination Bracket Tree Mechanics",
      desc: "An engineering review of seed generation, match scheduling, and real-time updates in modern combat sports software tournament management.",
      date: "April 12, 2026",
      author: "Anuja",
      category: "TOURNAMENT LOGISTICS",
      tag: "WRESTLING",
      cover: "/images/covers/blog-bracket-mechanics.svg"
    },
    {
      title: "Recovery Protocols for High-Volume Grapplers",
      desc: "Evidence-based recovery techniques including contrast water therapy, active mobility drills, and nutrition timing for athletes training 5+ days per week.",
      date: "March 20, 2026",
      author: "Shravan",
      category: "ATHLETE RECOVERY",
      tag: "BJJ",
      cover: "/images/covers/blog-recovery-methods.svg"
    },
    {
      title: "Hydration Science for Combat Sports Competitors",
      desc: "How to safely manage cut weight, rehydration protocols post-weigh-in, and electrolyte strategies that maximize same-day performance in the bracket.",
      date: "February 8, 2026",
      author: "Pratik",
      category: "SPORTS NUTRITION",
      tag: "MMA",
      cover: "/images/covers/blog-hydration-guide.svg"
    }
  ];

  return (
    <div className="relative min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      {/* Header Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase mb-6 font-mono"
        >
          <Sparkles className="h-3.5 w-3.5" /> RECENT INSIGHTS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight uppercase"
        >
          THE ATHLIX LOGS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="mt-6 text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Log reviews, scheduling guides, and software specifications direct from our product team.
        </motion.p>
      </section>

      {/* Grid of articles */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border/60 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <SpotlightCard key={idx} className="bg-secondary border border-border rounded-sm flex flex-col overflow-hidden">
              {/* Cover image */}
              <div className="relative h-36 overflow-hidden bg-surface border-b border-border shrink-0">
                <img
                  src={article.cover}
                  alt={article.title}
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 to-transparent pointer-events-none" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="text-[9px] font-bold text-primary font-mono tracking-wider uppercase bg-secondary/90 border border-primary/20 px-2 py-0.5 rounded-sm">
                    {article.tag}
                  </span>
                  <span className="text-[8px] font-bold text-text-tertiary font-mono tracking-widest uppercase bg-secondary/80 px-1.5 py-0.5 rounded-sm hidden sm:inline-block">
                    {article.category}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-base font-display font-black uppercase tracking-wide mb-2 hover:text-primary transition-colors cursor-pointer leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-text-secondary text-xs leading-relaxed font-sans">
                    {article.desc}
                  </p>
                </div>

                <div>
                  <hr className="border-border/40 my-4" />
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-text-secondary">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {article.date.toUpperCase()}</span>
                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {article.author.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
