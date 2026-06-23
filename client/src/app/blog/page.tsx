'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';

export default function BlogPage() {
  const articles = [
    {
      title: "How to Optimize Your BJJ Training Schedules",
      desc: "A breakdown of structuring rolling rounds, drilling time, recovery days, and belt level benchmarks.",
      date: "June 18, 2026",
      author: "Pratik",
      category: "BJJ",
      image: "🥋"
    },
    {
      title: "Inside MMA Weight Cut Analytics",
      desc: "How modern sports-tech tracks performance, hydration levels, and metabolic efficiency leading to fight night.",
      date: "May 29, 2026",
      author: "Kirat",
      category: "MMA",
      image: "🥊"
    },
    {
      title: "Digital Brackets and Tournament Growth",
      desc: "How automated double-elimination software is scaling registrations and matching tournament brackets instantly.",
      date: "April 12, 2026",
      author: "Anuja",
      category: "Tournaments",
      image: "🏆"
    }
  ];

  return (
    <div className="relative min-h-screen bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary tracking-widest uppercase mb-6 font-mono"
        >
          <Sparkles className="h-3.5 w-3.5" /> REVELATIONS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-5xl sm:text-7xl font-black font-display tracking-tight uppercase"
        >
          ATHLIX CHRONICLES
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed"
        >
          Latest news, technical tips, and platform updates straight from the ATHLIX development founders.
        </motion.p>
      </section>

      {/* Grid of articles */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <SpotlightCard key={idx} className="bg-secondary border border-border p-6 flex flex-col justify-between h-full">
              <div>
                <div className="text-4xl mb-4">{article.image}</div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-primary font-mono tracking-widest uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                    {article.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-display uppercase tracking-wide mb-3 hover:text-primary transition-colors cursor-pointer leading-tight">
                  {article.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  {article.desc}
                </p>
              </div>

              <div>
                <hr className="border-border my-4" />
                <div className="flex justify-between items-center text-xs text-text-secondary">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {article.date}</span>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {article.author}</span>
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
