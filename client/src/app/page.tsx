'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Trophy, Brain, TrendingUp, Shield, Star, ChevronRight, Activity, Zap, Target, Calendar, Video, MessageSquare, CheckCircle } from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';
import { GlassCard } from '../components/shared/GlassCard';
import { cn } from '../lib/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Animated counter component
const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="font-display text-4xl md:text-5xl font-bold text-text-primary">
      {count}{suffix}
    </span>
  );
};

// Feature card data
const features = [
  {
    icon: Brain,
    title: "AI Intelligence",
    description: "Deep learning algorithms analyze your performance and provide personalized feedback and training plans.",
    color: "text-accent"
  },
  {
    icon: Trophy,
    title: "Tournament Engine",
    description: "Run professional tournaments with automated brackets, live scoring, and real-time participant management.",
    color: "text-accent"
  },
  {
    icon: Users,
    title: "Academy CRM",
    description: "Manage your entire academy from student onboarding to curriculum tracking and progress monitoring.",
    color: "text-accent"
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description: "Track your progress over time with detailed metrics, charts, and comparative analysis tools.",
    color: "text-accent"
  },
  {
    icon: Target,
    title: "Recruitment Hub",
    description: "Connect with scouts and organizations looking for talent like you. Showcase your skills and achievements.",
    color: "text-accent"
  },
  {
    icon: Shield,
    title: "Verified Network",
    description: "Join a trusted community of verified athletes, coaches, academies, and sports organizations.",
    color: "text-accent"
  }
];

// How it works data
const howItWorks = [
  { step: "01", title: "Create Profile", desc: "Sign up and build your professional sports profile" },
  { step: "02", title: "AI Analysis", desc: "Our AI analyzes your performance and goals" },
  { step: "03", title: "Get Coaching", desc: "Receive personalized training recommendations" },
  { step: "04", title: "Join Tournaments", desc: "Find and compete in events that match your level" },
  { step: "05", title: "Get Discovered", desc: "Connect with recruiters and opportunities" },
  { step: "06", title: "Grow", desc: "Track progress and achieve your sports career goals" }
];

// Testimonials
const testimonials = [
  {
    name: "Sarah Chen",
    role: "Professional Athlete",
    text: "Athlix transformed my training. The AI feedback is like having a world-class coach with me 24/7.",
    rating: 5
  },
  {
    name: "Marcus Rodriguez",
    role: "Academy Owner",
    text: "Managing my academy has never been easier. The CRM and tournament tools are game-changers.",
    rating: 5
  },
  {
    name: "Dr. Emily Watson",
    role: "Sports Scientist",
    text: "The data-driven approach Athlix provides is exactly what the sports industry needs.",
    rating: 5
  }
];

// FAQ data
const faqs = [
  {
    question: "What makes Athlix different from other sports platforms?",
    answer: "Athlix is the only platform that connects athletes, coaches, academies, recruiters, and tournament organizers through a single AI-powered ecosystem. We're not just an app – we're the operating system for sports."
  },
  {
    question: "How does the AI coaching work?",
    answer: "Our AI analyzes your performance data, video footage, and training history to provide personalized recommendations, technique corrections, and training plans tailored specifically to you."
  },
  {
    question: "Is my data safe and secure?",
    answer: "Absolutely. We use enterprise-grade encryption and security protocols. Your data is yours – we never sell it or share it without your explicit permission."
  },
  {
    question: "Can I try Athlix for free?",
    answer: "Yes! We offer a free trial with full access to all our features. No credit card required to get started."
  }
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      <main className="relative z-10 pt-24 pb-20">
        {/* HERO SECTION */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-8"
              >
                <motion.div variants={itemVariants}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm font-semibold text-text-secondary">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    AI 2.0 Now Live
                  </div>
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="text-4xl md:text-6xl lg:text-7xl font-bold font-display leading-tight tracking-tight"
                >
                  The Future Operating
                  <span className="text-gradient-accent"> System for Sports</span>
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="text-lg md:text-xl text-text-secondary max-w-xl"
                >
                  One intelligent platform connecting athletes, coaches, academies, recruiters, and tournament organizers with AI at its core.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <MagneticButton variant="premium" size="lg">
                      Start Free <ArrowRight className="w-5 h-5 ml-2" />
                    </MagneticButton>
                  </Link>
                  <Link href="/features" className="w-full sm:w-auto">
                    <MagneticButton variant="outline" size="lg">
                      Explore Platform
                    </MagneticButton>
                  </Link>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-8 pt-8 border-t border-border"
                >
                  {["UFC", "Bellator", "ONE", "Glory"].map((brand, i) => (
                    <span key={i} className="text-xl font-bold text-text-tertiary opacity-60 font-display">
                      {brand}
                    </span>
                  ))}
                </motion.div>
              </motion.div>

              {/* Hero Visual */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative"
              >
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassCard className="p-6 md:p-8 hover:border-accent/30 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                      <Trophy className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-2">Tournaments</h3>
                    <p className="text-text-secondary text-sm">Automated brackets & live scoring</p>
                  </GlassCard>

                  <GlassCard className="p-6 md:p-8 hover:border-accent/30 transition-all duration-300 mt-8">
                    <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-info" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-2">Athletes</h3>
                    <p className="text-text-secondary text-sm">Performance tracking & analytics</p>
                  </GlassCard>

                  <GlassCard className="p-6 md:p-8 hover:border-accent/30 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                      <Brain className="w-6 h-6 text-success" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-2">AI Coach</h3>
                    <p className="text-text-secondary text-sm">Personalized training & feedback</p>
                  </GlassCard>

                  <GlassCard className="p-6 md:p-8 hover:border-accent/30 transition-all duration-300 mt-8">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                      <Activity className="w-6 h-6 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold font-display mb-2">Analytics</h3>
                    <p className="text-text-secondary text-sm">Data-driven insights</p>
                  </GlassCard>
                </div>

                {/* Background Orbs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-info/10 rounded-full blur-3xl" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="py-16 px-4 border-y border-border bg-surface/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { label: "Active Athletes", value: 50, suffix: "k+" },
                { label: "Tournaments Hosted", value: 1200, suffix: "+" },
                { label: "AI Reports Generated", value: 250, suffix: "k+" },
                { label: "Partner Academies", value: 350, suffix: "+" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="text-center"
                >
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  <p className="mt-2 text-lg text-text-secondary">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 md:py-28 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm font-semibold text-text-secondary mb-6">
                <Zap className="w-4 h-4 text-accent" />
                Platform Overview
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                Everything you need to transform sports
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Six powerful modules working together as one unified ecosystem.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <GlassCard className="p-8 hover:border-accent/30 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mb-6">
                      <feature.icon className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold font-display mb-3">{feature.title}</h3>
                    <p className="text-text-secondary">{feature.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="py-20 md:py-28 px-4 bg-surface/30">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm font-semibold text-text-secondary mb-6">
                <Activity className="w-4 h-4 text-accent" />
                The Workflow
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                How Athlix works
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                From athlete to champion in six seamless steps.
              </p>
            </motion.div>

            <div className="relative">
              {/* Timeline line (desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-border" />

              <div className="grid md:grid-cols-6 gap-4 md:gap-6">
                {howItWorks.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="relative z-10"
                  >
                    <GlassCard className="p-6 text-center h-full">
                      <div className="text-4xl font-bold font-numbers text-accent mb-4">{item.step}</div>
                      <h4 className="text-lg font-bold font-display mb-2">{item.title}</h4>
                      <p className="text-sm text-text-secondary">{item.desc}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm font-semibold text-text-secondary mb-6">
                <Star className="w-4 h-4 text-accent" />
                Testimonials
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                What athletes are saying
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <GlassCard className="p-8">
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 text-accent fill-accent" />
                      ))}
                    </div>
                    <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center font-bold text-text-inverse">
                        {testimonial.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-bold">{testimonial.name}</p>
                        <p className="text-sm text-text-secondary">{testimonial.role}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-20 md:py-28 px-4 bg-surface/30">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm font-semibold text-text-secondary mb-6">
                <MessageSquare className="w-4 h-4 text-accent" />
                FAQ
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
                Frequently asked questions
              </h2>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left bg-background border border-border rounded-2xl p-6 hover:border-accent/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{faq.question}</span>
                      <motion.div
                        animate={{ rotate: openFaq === i ? 45 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="pt-6 text-text-secondary leading-relaxed">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 md:py-28 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <GlassCard className="relative overflow-hidden p-12 md:p-20 text-center">
                {/* Background effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display mb-6">
                    Ready to transform sports?
                  </h2>
                  <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto">
                    Join thousands of athletes, coaches, and organizations already using Athlix to redefine what's possible.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/signup" className="w-full sm:w-auto">
                      <MagneticButton variant="premium" size="lg">
                        Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                      </MagneticButton>
                    </Link>
                    <Link href="/features" className="w-full sm:w-auto">
                      <MagneticButton variant="outline" size="lg">
                        Book a Demo
                      </MagneticButton>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Helper Components
function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
