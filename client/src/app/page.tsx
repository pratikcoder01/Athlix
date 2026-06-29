'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Play, Zap, Shield, Trophy, Users, 
  ChevronDown, Activity, Brain, TrendingUp, 
  CheckCircle, X, ChevronRight as ChevronRightIcon,
  LineChart, BarChart3, Network, Star, Target,
  Calendar, Video, MessageSquare, Award
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';

// --- Reusable Components ---

const SectionHeading = ({ 
  preTitle, 
  title, 
  subtitle, 
  align = 'left' 
}: { 
  preTitle?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}) => (
  <div className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    {preTitle && (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold tracking-wider uppercase mb-4"
      >
        <Zap className="w-3 h-3 fill-current" />
        {preTitle}
      </motion.div>
    )}
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="text-4xl md:text-6xl font-bold font-display leading-tight tracking-tight"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

const PremiumButton = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}: any) => {
  const baseStyles = "relative inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 overflow-hidden group";
  const sizeStyles = {
    sm: "px-5 py-2 text-sm",
    md: "px-7 py-3 text-base",
    lg: "px-9 py-4 text-lg"
  };
  const variantStyles = {
    primary: "bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]",
    accent: "bg-gradient-to-r from-accent to-accent-secondary text-white shadow-[0_0_30px_rgba(255,45,85,0.4)] hover:shadow-[0_0_40px_rgba(255,45,85,0.6)]",
    outline: "border border-white/20 text-white hover:border-white/40 hover:bg-white/5 backdrop-blur-sm"
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
    </button>
  );
};

const PremiumCard = ({ 
  children, 
  className = '', 
  hoverEffect = true 
}: {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-accent/20 via-transparent to-accent-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative bg-card border border-white/10 rounded-3xl p-8 transition-all duration-500 group-hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-accent/10">
      {children}
    </div>
  </div>
);

// --- Hero Visualization Component ---

const HeroVisualization = () => {
  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center">
      {/* Animated Gradient Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1], 
          opacity: [0.5, 0.8, 0.5] 
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ 
          scale: [1.1, 1, 1.1], 
          opacity: [0.4, 0.6, 0.4] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent-secondary/20 rounded-full blur-3xl"
      />

      {/* Center Visualization */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Trophy, title: "Tournaments", color: "from-accent to-accent-secondary" },
          { icon: Users, title: "Athletes", color: "from-accent-secondary to-accent" },
          { icon: Brain, title: "AI Coach", color: "from-accent to-purple-500" }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="bg-card/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center"
          >
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
              <item.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold font-display">{item.title}</h3>
          </motion.div>
        ))}
      </div>

      {/* Floating Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 600 600">
        <motion.path
          d="M100 300 Q 300 200 500 300"
          stroke="url(#gradient1)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="10 10"
          animate={{ strokeDashoffset: [0, 20] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M100 350 Q 300 450 500 350"
          stroke="url(#gradient2)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="10 10"
          animate={{ strokeDashoffset: [20, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF2D55" />
            <stop offset="100%" stopColor="#4F8CFF" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F8CFF" />
            <stop offset="100%" stopColor="#FF2D55" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// --- Stats Component ---

const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
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
    <span className="text-5xl md:text-7xl font-bold font-numbers text-white">
      {count}{suffix}
    </span>
  );
};

// --- Main Page Component ---

export default function Home() {
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: "AI Intelligence",
      description: "Deep learning algorithms analyze your performance to provide personalized feedback and training recommendations.",
      color: "text-accent"
    },
    {
      icon: Trophy,
      title: "Tournament Engine",
      description: "Run professional tournaments with automated brackets, live scoring, and real-time participant management.",
      color: "text-accent-secondary"
    },
    {
      icon: Users,
      title: "Academy CRM",
      description: "Manage your entire academy, from student onboarding to curriculum tracking and progress monitoring.",
      color: "text-purple-400"
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Track your progress over time with detailed metrics, charts, and comparative analysis tools.",
      color: "text-green-400"
    },
    {
      icon: Target,
      title: "Recruitment Hub",
      description: "Connect with scouts and organizations looking for talent like you. Showcase your skills and achievements.",
      color: "text-yellow-400"
    },
    {
      icon: Shield,
      title: "Verified Network",
      description: "Join a trusted community of verified athletes, coaches, academies, and sports organizations.",
      color: "text-blue-400"
    }
  ];

  const stats = [
    { label: "Active Athletes", value: 50000, suffix: "+" },
    { label: "Tournaments Hosted", value: 1200, suffix: "+" },
    { label: "AI Reports Generated", value: 250000, suffix: "+" },
    { label: "Partner Academies", value: 350, suffix: "+" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Professional Athlete",
      text: "Athlix transformed my training. The AI feedback is like having a world-class coach with me 24/7.",
      avatar: "SC"
    },
    {
      name: "Marcus Rodriguez",
      role: "Academy Owner",
      text: "Managing my academy has never been easier. The CRM and tournament tools are game-changers.",
      avatar: "MR"
    },
    {
      name: "Dr. Emily Watson",
      role: "Sports Scientist",
      text: "The data-driven approach Athlix provides is exactly what the sports industry needs.",
      avatar: "EW"
    }
  ];

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

  return (
    <div className="min-h-screen bg-background text-white relative">
      {/* Floating Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-3xl px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center font-bold text-xl">
                A
              </div>
              <span className="text-2xl font-bold font-display tracking-tight">Athlix</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-text-secondary hover:text-white transition-colors">Features</Link>
              <Link href="#how" className="text-sm text-text-secondary hover:text-white transition-colors">How it works</Link>
              <Link href="#pricing" className="text-sm text-text-secondary hover:text-white transition-colors">Pricing</Link>
              <Link href="#about" className="text-sm text-text-secondary hover:text-white transition-colors">About</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-white transition-colors hidden sm:block">Log in</Link>
              <PremiumButton variant="primary" size="sm">
                Get Started
              </PremiumButton>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium mb-6">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Now Live - AI 2.0
                  </div>
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-display leading-[0.95] tracking-tight mb-6">
                    The Future Operating
                    <span className="bg-gradient-to-r from-accent via-white to-accent-secondary bg-clip-text text-transparent"> System for Sports</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-text-secondary max-w-xl mb-10 leading-relaxed">
                    One intelligent platform connecting athletes, coaches, academies, recruiters, and tournament organizers with AI at its core.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <PremiumButton variant="accent" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                      Start Free
                    </PremiumButton>
                    <PremiumButton variant="outline" size="lg" icon={<Play className="w-5 h-5" />}>
                      Watch Demo
                    </PremiumButton>
                  </div>
                </motion.div>

                {/* Trusted By */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="pt-8 border-t border-white/10"
                >
                  <p className="text-sm text-text-tertiary mb-4 font-medium uppercase tracking-wider">Trusted by world-class organizations</p>
                  <div className="flex flex-wrap items-center gap-8">
                    {['UFC', 'Bellator', 'ONE', 'Glory', 'Karate Combat'].map((brand, i) => (
                      <div key={i} className="text-2xl font-bold text-text-tertiary opacity-40 font-display">
                        {brand}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="relative">
                <HeroVisualization />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 px-4 border-y border-white/10 bg-surface/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
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

        {/* Features Section */}
        <section id="features" className="py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeading 
              preTitle="Platform Overview"
              title="Everything you need to transform sports"
              subtitle="Six powerful modules working together as one unified ecosystem."
              align="center"
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <PremiumCard>
                    <div className={`w-14 h-14 rounded-2xl bg-card border border-white/10 flex items-center justify-center mb-6 ${feature.color}`}>
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold font-display mb-3">{feature.title}</h3>
                    <p className="text-text-secondary leading-relaxed">{feature.description}</p>
                  </PremiumCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="py-32 px-4 bg-surface/30">
          <div className="max-w-7xl mx-auto">
            <SectionHeading 
              preTitle="The Workflow"
              title="How Athlix works"
              subtitle="From athlete to champion in six seamless steps."
              align="center"
            />

            <div className="relative mt-20">
              {/* Timeline Line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent hidden md:block" />
              
              <div className="grid md:grid-cols-6 gap-4">
                {[
                  { num: "01", title: "Create Profile", desc: "Sign up and build your professional sports profile" },
                  { num: "02", title: "AI Analysis", desc: "Our AI analyzes your performance and goals" },
                  { num: "03", title: "Get Coaching", desc: "Receive personalized training recommendations" },
                  { num: "04", title: "Join Tournaments", desc: "Find and compete in events that match your level" },
                  { num: "05", title: "Get Discovered", desc: "Connect with recruiters and opportunities" },
                  { num: "06", title: "Grow", desc: "Track progress and achieve your sports career goals" }
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="relative z-10"
                  >
                    <div className="bg-card border border-white/10 rounded-3xl p-6 h-full text-center">
                      <div className="text-4xl font-bold font-numbers text-accent mb-4">{step.num}</div>
                      <h4 className="text-lg font-bold font-display mb-2">{step.title}</h4>
                      <p className="text-sm text-text-secondary">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeading 
              preTitle="Testimonials"
              title="What athletes are saying"
              align="center"
            />

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <PremiumCard>
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 text-accent fill-accent" />
                      ))}
                    </div>
                    <p className="text-lg text-text-secondary mb-8 leading-relaxed">"{testimonial.text}"</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold">{testimonial.name}</p>
                        <p className="text-sm text-text-secondary">{testimonial.role}</p>
                      </div>
                    </div>
                  </PremiumCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 px-4 bg-surface/30">
          <div className="max-w-3xl mx-auto">
            <SectionHeading 
              preTitle="FAQ"
              title="Frequently asked questions"
              align="center"
            />

            <div className="space-y-4 mt-12">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full bg-card border border-white/10 rounded-2xl p-6 text-left hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{faq.question}</span>
                      <motion.div
                        animate={{ rotate: openFaq === i ? 45 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="pt-4 text-text-secondary leading-relaxed">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden bg-gradient-to-br from-accent/20 via-card to-accent-secondary/20 border border-white/10 rounded-[3rem] p-12 md:p-20 text-center"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">Ready to transform sports?</h2>
                <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">Join thousands of athletes, coaches, and organizations already using Athlix to redefine what's possible.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <PremiumButton variant="accent" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                    Get Started Free
                  </PremiumButton>
                  <PremiumButton variant="outline" size="lg">
                    Book a Demo
                  </PremiumButton>
                </div>
              </div>
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
