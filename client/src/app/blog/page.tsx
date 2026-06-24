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
      desc: "A technical breakdown of organizing live rolling, technique drills, active recovery sessions, and rank stripe goals.",
      date: "June 18, 2026",
      author: "Pratik",
      category: "TRAINING METHODOLOGY",
      tag: "BJJ"
    },
    {
      title: "MMA Weight Logging & Proactive Analytics",
      desc: "How modern fighters track weight logs, metabolic output, and hydration levels during the final weeks of fight preparation.",
      date: "May 29, 2026",
      author: "Kirat",
      category: "SPORTS PERFORMANCE",
      tag: "MMA"
    },
    {
      title: "Double-Elimination Bracket Tree Mechanics",
      desc: "An engineering review of seed generation, match scheduling, and real-time updates in modern combat sports software.",
      date: "April 12, 2026",
      author: "Anuja",
      category: "TOURNAMENT LOGISTICS",
      tag: "WRESTLING"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <SpotlightCard key={idx} className="bg-secondary border border-border p-6 rounded-sm flex flex-col justify-between h-[380px]">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-bold text-primary font-mono tracking-wider uppercase bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-sm">
                    {article.tag}
                  </span>
                  <span className="text-[8px] font-bold text-text-tertiary font-mono tracking-widest uppercase">
                    {article.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-display font-black uppercase tracking-wide mb-3 hover:text-primary transition-colors cursor-pointer leading-tight">
                  {article.title}
                </h3>
                
                <p className="text-text-secondary text-xs leading-relaxed mb-6 font-sans">
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
            </SpotlightCard>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
