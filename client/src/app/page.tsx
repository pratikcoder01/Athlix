'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Award, ChevronRight, Calendar, User, CheckCircle2,
  TrendingUp, MapPin, Activity, Shield, Sparkles, Trophy
} from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import MagneticButton from '../components/shared/MagneticButton';
import SpotlightCard from '../components/shared/SpotlightCard';
import StatsBar from '../components/shared/StatsBar';

const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay, duration: 0.4, ease: EASE_OUT },
  },
});

/* ─────────────────────── Interactive Bracket Simulator Widget ─────────────────── */
interface Athlete {
  id: string;
  name: string;
  weight: string;
  seed: string;
  team: string;
  avatar: string;
}

const initialAthletes: Athlete[] = [
  { id: '1', name: 'Renato Silva', weight: '77 kg', seed: 'Seed 1', team: 'Renzo Gracie SF', avatar: 'RS' },
  { id: '2', name: 'Marcus Silva', weight: '77 kg', seed: 'Seed 8', team: 'Silva BJJ', avatar: 'MS' },
  { id: '3', name: 'Kevin Lee', weight: '77 kg', seed: 'Seed 4', team: 'Academy X', avatar: 'KL' },
  { id: '4', name: 'Ryan Gracie', weight: '77 kg', seed: 'Seed 5', team: 'Gracie Barra', avatar: 'RG' },
  { id: '5', name: 'Gordon Ryan', weight: '99 kg', seed: 'Seed 2', team: 'New Wave BJJ', avatar: 'GR' },
  { id: '6', name: 'Nicholas Meregali', weight: '99 kg', seed: 'Seed 7', team: 'Dream Art', avatar: 'NM' },
  { id: '7', name: 'Craig Jones', weight: '88 kg', seed: 'Seed 3', team: 'B-Team', avatar: 'CJ' },
  { id: '8', name: 'Lachlan Giles', weight: '77 kg', seed: 'Seed 6', team: 'Absolute MMA', avatar: 'LG' },
];

const mockStats: { [key: string]: string } = {
  qf1: "Silva leads head-to-head 2-0. 85% submission rate from back mount.",
  qf2: "Gracie carries 4-match submission streak. Lee has a 3-1 takedown advantage.",
  qf3: "Ryan: 18-0 undefeated record. Meregali: 90% guard pass efficiency.",
  qf4: "Jones: Leg-lock specialist. Giles: Veteran heel hook entry master.",
  sf1: "Projected Semifinal Matchup. Winner advances to the Gold Medal Round.",
  sf2: "Projected Semifinal Matchup. Heavily anticipated submission battle.",
  finals: "Championship Gold Match. Winner takes the tournament trophy."
};

const getStats = (matchKey: string, p1: Athlete | null, p2: Athlete | null) => {
  if (!p1 || !p2) {
    return "Awaiting advancing athletes to generate statistics.";
  }
  return mockStats[matchKey] || `${p1.name} vs ${p2.name}`;
};

const AthleteSlot: React.FC<{
  athlete: Athlete | null;
  isSelected: boolean;
  isOpponentSelected: boolean;
  onClick: () => void;
}> = ({ athlete, isSelected, isOpponentSelected, onClick }) => {
  if (!athlete) {
    return (
      <div className="flex items-center p-3 h-12 bg-surface/30 border border-dashed border-border/20 text-text-tertiary text-[10px] italic">
        Awaiting advancement
      </div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      animate={isSelected ? {
        scale: [1, 1.03, 1],
        borderColor: ["var(--accent-gold)", "#ffffff", "var(--accent-gold)"],
        boxShadow: [
          "0 0 0px rgba(212,164,55,0)",
          "0 0 15px rgba(212,164,55,0.6)",
          "0 0 8px rgba(212,164,55,0.2)"
        ]
      } : {}}
      transition={{ duration: 0.3 }}
      className={`flex items-center justify-between p-3 h-12 border cursor-pointer select-none transition-all duration-200 ${
        isSelected
          ? 'bg-primary/10 border-accent-gold text-text-primary shadow-[0_0_8px_rgba(212,164,55,0.2)] font-semibold'
          : isOpponentSelected
          ? 'bg-surface/20 border-border/40 text-text-secondary opacity-65 hover:opacity-100 hover:border-border hover:bg-surface/30'
          : 'bg-surface/90 border-border text-text-primary hover:border-primary/50'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 ${
          isSelected ? 'bg-primary text-white border border-accent-gold/50' : 'bg-secondary text-text-secondary border border-border'
        }`}>
          {athlete.avatar}
        </div>
        <div className="truncate">
          <span className="block text-xs uppercase tracking-wide truncate max-w-[100px]">{athlete.name}</span>
          <span className="block text-[8px] text-text-secondary truncate">{athlete.weight} • {athlete.seed}</span>
        </div>
      </div>
      {isSelected && (
        <span className="text-[8px] font-bold text-accent-gold tracking-widest font-mono shrink-0 flex items-center gap-0.5">
          ADV <CheckCircle2 className="h-3 w-3 text-accent-gold" />
        </span>
      )}
    </motion.div>
  );
};

const MatchBox: React.FC<{
  matchKey: string;
  title: string;
  p1: Athlete | null;
  p2: Athlete | null;
  winner: Athlete | null;
  onSelectWinner: (winner: Athlete) => void;
  hoveredMatch: string | null;
  setHoveredMatch: (key: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({ matchKey, title, p1, p2, winner, onSelectWinner, hoveredMatch, setHoveredMatch, className = "", style }) => {
  const isHovered = hoveredMatch === matchKey;
  return (
    <div
      onMouseEnter={() => setHoveredMatch(matchKey)}
      onMouseLeave={() => setHoveredMatch(null)}
      className={`w-[180px] bg-secondary/60 rounded-sm border border-border shadow-sm transition-all duration-200 ${className}`}
      style={style}
    >
      <div className="bg-surface/95 border-b border-border/80 px-3 py-1.5 flex justify-between items-center text-[9px] font-bold text-text-secondary uppercase font-mono tracking-wider">
        <span>{title}</span>
        {winner && <span className="text-primary font-mono text-[8px]">ADVANCED</span>}
      </div>

      <div className="flex flex-col">
        <AthleteSlot
          athlete={p1}
          isSelected={winner !== null && winner.id === p1?.id}
          isOpponentSelected={winner !== null && winner.id !== p1?.id}
          onClick={() => p1 && onSelectWinner(p1)}
        />
        <div className="h-[1px] bg-border/40" />
        <AthleteSlot
          athlete={p2}
          isSelected={winner !== null && winner.id === p2?.id}
          isOpponentSelected={winner !== null && winner.id !== p2?.id}
          onClick={() => p2 && onSelectWinner(p2)}
        />
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-20 left-1/2 -translate-x-1/2 -bottom-24 w-[200px] bg-surface border border-accent-gold/40 p-3 rounded-sm shadow-xl font-mono text-[9px] text-text-secondary leading-relaxed pointer-events-none"
          >
            <div className="text-[8px] font-bold text-primary mb-1 uppercase tracking-widest font-sans">Matchup Statistics</div>
            {getStats(matchKey, p1, p2)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChampionBox: React.FC<{
  champion: Athlete | null;
  resetBracket: () => void;
}> = ({ champion, resetBracket }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-[9px] font-bold tracking-widest text-text-secondary uppercase font-mono mb-3">
        CHAMPION
      </div>
      <AnimatePresence mode="wait">
        {champion ? (
          <motion.div
            key={champion.id}
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{
              scale: [0.9, 1.05, 1],
              opacity: 1,
              y: 0,
              boxShadow: [
                "0 0 0px rgba(212,164,55,0)",
                "0 0 20px rgba(212,164,55,0.5)",
                "0 0 10px rgba(212,164,55,0.2)"
              ]
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-accent-gold/10 border border-accent-gold p-4 rounded-sm w-[180px] flex flex-col items-center relative"
          >
            <Trophy className="h-8 w-8 text-accent-gold mb-2 animate-bounce" style={{ animationDuration: '2.5s' }} />
            <span className="text-[9px] font-bold font-mono tracking-widest text-accent-gold uppercase">
              GOLD MEDALIST
            </span>
            <span className="text-xs font-display font-black text-text-primary tracking-wide uppercase mt-1 text-center truncate w-full">
              {champion.name}
            </span>
            <span className="text-[9px] text-text-secondary mt-0.5 truncate w-full">{champion.team}</span>
          </motion.div>
        ) : (
          <div className="w-[180px] h-[115px] border border-dashed border-border-strong/30 rounded-sm flex items-center justify-center text-text-tertiary italic text-[11px] px-4 text-center bg-surface/20">
            Advance fighters to crown champion
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function InteractiveBracketSimulator() {
  const [qfWinners, setQfWinners] = useState<(Athlete | null)[]>([null, null, null, null]);
  const [sfWinners, setSfWinners] = useState<(Athlete | null)[]>([null, null]);
  const [champion, setChampion] = useState<Athlete | null>(null);
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'qf' | 'sf' | 'finals'>('qf');

  const handleQfWinner = (index: number, winner: Athlete) => {
    const nextQfWinners = [...qfWinners];
    const prevWinner = nextQfWinners[index];
    nextQfWinners[index] = winner;
    setQfWinners(nextQfWinners);

    if (prevWinner && prevWinner.id !== winner.id) {
      const sfIndex = Math.floor(index / 2);
      const nextSfWinners = [...sfWinners];
      nextSfWinners[sfIndex] = null;
      setSfWinners(nextSfWinners);
      setChampion(null);
    }
  };

  const handleSfWinner = (index: number, winner: Athlete) => {
    const nextSfWinners = [...sfWinners];
    const prevWinner = nextSfWinners[index];
    nextSfWinners[index] = winner;
    setSfWinners(nextSfWinners);

    if (prevWinner && prevWinner.id !== winner.id) {
      setChampion(null);
    }
  };

  const handleChampion = (winner: Athlete) => {
    setChampion(winner);
  };

  const resetBracket = () => {
    setQfWinners([null, null, null, null]);
    setSfWinners([null, null]);
    setChampion(null);
  };

  const qfMatchups = [
    { p1: initialAthletes[0], p2: initialAthletes[1], title: "Quarterfinal 1", key: "qf1", index: 0 },
    { p1: initialAthletes[2], p2: initialAthletes[3], title: "Quarterfinal 2", key: "qf2", index: 1 },
    { p1: initialAthletes[4], p2: initialAthletes[5], title: "Quarterfinal 3", key: "qf3", index: 2 },
    { p1: initialAthletes[6], p2: initialAthletes[7], title: "Quarterfinal 4", key: "qf4", index: 3 },
  ];

  const sfMatchups = [
    { p1: qfWinners[0], p2: qfWinners[1], title: "Semifinal 1", key: "sf1", index: 0 },
    { p1: qfWinners[2], p2: qfWinners[3], title: "Semifinal 2", key: "sf2", index: 1 },
  ];

  const finalsMatchup = {
    p1: sfWinners[0],
    p2: sfWinners[1],
    title: "Championship Final",
    key: "finals"
  };

  return (
    <div className="w-full bg-secondary/80 border border-border rounded-sm p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bracket-dots pointer-events-none opacity-40" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono">
            SIGNATURE INTERACTIVE TOURNAMENT
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-black text-text-primary tracking-wide uppercase mt-1">
            TEST THE BRACKET MATCHMAKER
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Tap athletes below to advance seeds round-by-round. Hover matches for statistical insights.
          </p>
        </div>
        <button
          onClick={resetBracket}
          className="text-xs font-mono font-bold tracking-wider text-text-secondary hover:text-primary transition-colors border border-border px-3 py-1.5 rounded-sm bg-surface cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
        >
          RESET BRACKET
        </button>
      </div>

      {/* Desktop Tree View (md and up) */}
      <div className="hidden md:block overflow-x-auto py-8">
        <div className="relative w-[1000px] h-[530px] mx-auto">
          {/* Connector Lines */}
          <svg className="absolute inset-0 pointer-events-none w-[1000px] h-[530px]" viewBox="0 0 1000 530" fill="none">
            {/* Round 1 Connectors */}
            <motion.path
              d="M 200 70 H 240 V 135 H 280"
              stroke={qfWinners[0] ? "var(--primary)" : "var(--border-strong)"}
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            />
            <motion.path
              d="M 200 200 H 240 V 135 H 280"
              stroke={qfWinners[0] ? "var(--primary)" : "var(--border-strong)"}
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            />
            <motion.path
              d="M 200 330 H 240 V 395 H 280"
              stroke={qfWinners[1] ? "var(--primary)" : "var(--border-strong)"}
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            />
            <motion.path
              d="M 200 460 H 240 V 395 H 280"
              stroke={qfWinners[1] ? "var(--primary)" : "var(--border-strong)"}
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            />

            {/* Round 2 Connectors */}
            <motion.path
              d="M 460 135 H 500 V 265 H 540"
              stroke={sfWinners[0] ? "var(--primary)" : "var(--border-strong)"}
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
            />
            <motion.path
              d="M 460 395 H 500 V 265 H 540"
              stroke={sfWinners[1] ? "var(--primary)" : "var(--border-strong)"}
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
            />

            {/* Finals Connector */}
            <motion.path
              d="M 720 265 H 800"
              stroke={champion ? "var(--accent-gold)" : "var(--border-strong)"}
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.4, duration: 0.6, ease: 'easeOut' }}
            />
          </svg>

          {/* Quarterfinals Column */}
          {qfMatchups.map((m, idx) => (
            <MatchBox
              key={m.key}
              matchKey={m.key}
              title={m.title}
              p1={m.p1}
              p2={m.p2}
              winner={qfWinners[m.index]}
              onSelectWinner={(w) => handleQfWinner(m.index, w)}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              className="absolute"
              style={{ left: "20px", top: `${20 + idx * 130}px` }}
            />
          ))}

          {/* Semifinals Column */}
          {sfMatchups.map((m, idx) => (
            <MatchBox
              key={m.key}
              matchKey={m.key}
              title={m.title}
              p1={m.p1}
              p2={m.p2}
              winner={sfWinners[m.index]}
              onSelectWinner={(w) => handleSfWinner(m.index, w)}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              className="absolute"
              style={{ left: "280px", top: `${85 + idx * 260}px` }}
            />
          ))}

          {/* Finals Column */}
          <MatchBox
            matchKey={finalsMatchup.key}
            title={finalsMatchup.title}
            p1={finalsMatchup.p1}
            p2={finalsMatchup.p2}
            winner={champion}
            onSelectWinner={handleChampion}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            className="absolute"
            style={{ left: "540px", top: "215px" }}
          />

          {/* Champion Column */}
          <div className="absolute left-[800px] top-[195px] w-[180px] flex justify-center">
            <ChampionBox champion={champion} resetBracket={resetBracket} />
          </div>
        </div>
      </div>

      {/* Mobile Tabbed Round View (below md) */}
      <div className="block md:hidden">
        <div className="flex border-b border-border/80 mb-6">
          {(['qf', 'sf', 'finals'] as const).map((tab) => {
            const label = tab === 'qf' ? 'Quarterfinals' : tab === 'sf' ? 'Semifinals' : 'Finals & Champ';
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center text-[10px] font-mono font-bold tracking-wider uppercase border-b-2 transition-colors duration-200 cursor-pointer ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'qf' && (
            <motion.div
              key="qf-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 items-center"
            >
              {qfMatchups.map((m) => (
                <div key={m.key} className="w-full max-w-[280px] relative">
                  <MatchBox
                    matchKey={m.key}
                    title={m.title}
                    p1={m.p1}
                    p2={m.p2}
                    winner={qfWinners[m.index]}
                    onSelectWinner={(w) => handleQfWinner(m.index, w)}
                    hoveredMatch={hoveredMatch}
                    setHoveredMatch={setHoveredMatch}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'sf' && (
            <motion.div
              key="sf-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 items-center"
            >
              {sfMatchups.map((m) => (
                <div key={m.key} className="w-full max-w-[280px] relative">
                  <MatchBox
                    matchKey={m.key}
                    title={m.title}
                    p1={m.p1}
                    p2={m.p2}
                    winner={sfWinners[m.index]}
                    onSelectWinner={(w) => handleSfWinner(m.index, w)}
                    hoveredMatch={hoveredMatch}
                    setHoveredMatch={setHoveredMatch}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'finals' && (
            <motion.div
              key="finals-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 items-center"
            >
              <div className="w-full max-w-[280px] relative">
                <MatchBox
                  matchKey={finalsMatchup.key}
                  title={finalsMatchup.title}
                  p1={finalsMatchup.p1}
                  p2={finalsMatchup.p2}
                  winner={champion}
                  onSelectWinner={handleChampion}
                  hoveredMatch={hoveredMatch}
                  setHoveredMatch={setHoveredMatch}
                />
              </div>

              <div className="h-[1px] w-full max-w-[280px] bg-border/40 my-2" />

              <ChampionBox champion={champion} resetBracket={resetBracket} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────── Main Page ─────────────────────────────── */
export default function LandingPage() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      {/* Hero Section - Asymmetric Grid Layout */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-32 sm:px-6 lg:px-8">
        {/* Subtle background tatami-mat grid texture for combat sports identity */}
        <div className="absolute inset-0 mat-grid opacity-[0.8] pointer-events-none -z-10" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Text: Specific & Confident Copy */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <motion.div
              variants={shouldReduce ? {} : fadeUp(0)}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase mb-6 font-mono"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Direct scheduling & live brackets
            </motion.div>

            <motion.h1
              variants={shouldReduce ? {} : fadeUp(0.08)}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight leading-[1.05] text-text-primary uppercase"
            >
              SCHEDULE SPARRING & RUN BRACKETS
            </motion.h1>

            <motion.p
              variants={shouldReduce ? {} : fadeUp(0.16)}
              initial="hidden"
              animate="visible"
              className="mt-6 text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg"
            >
              BJJ, MMA, and wrestling academies use Athlix to manage private instruction availability, generate digital brackets, and log student rank stripes on shared timelines.
            </motion.p>

            <motion.div
              variants={shouldReduce ? {} : fadeUp(0.24)}
              initial="hidden"
              animate="visible"
              className="mt-8 flex flex-wrap gap-3.5"
            >
              <Link href="/signup">
                <MagneticButton
                  variant="primary"
                  className="py-3 px-6 rounded-sm text-xs font-bold font-mono tracking-wider uppercase"
                >
                  Create free profile
                </MagneticButton>
              </Link>
              <Link href="/features">
                <MagneticButton
                  variant="ghost"
                  className="py-3 px-6 rounded-sm text-xs font-bold font-mono tracking-wider uppercase"
                >
                  Explore features
                </MagneticButton>
              </Link>
            </motion.div>
          </div>

          {/* Hero Right Product Mockup */}
          <div className="lg:col-span-7 relative w-full">
            <motion.div
              variants={shouldReduce ? {} : fadeUp(0.32)}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              {/* Subtle orange accent glow behind mockup */}
              <div
                className="absolute -inset-2 bg-primary/5 rounded-sm blur-2xl pointer-events-none"
                style={{ clipPath: 'polygon(20% 0%, 100% 40%, 80% 100%, 0% 80%)' }}
              />

              <div className="relative rounded-sm border border-border bg-secondary/80 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-left">
                {/* Browser Frame Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-border/80">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong opacity-40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong opacity-40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-border-strong opacity-40"></span>
                  </div>
                  <div className="w-64 h-5 rounded-sm bg-background/50 border border-border/40 text-[9px] text-text-tertiary flex items-center justify-center font-mono tracking-wider uppercase">
                    dashboard.athlix.com
                  </div>
                  <div className="w-8"></div>
                </div>

                {/* Dashboard Area Mockup */}
                <div className="grid grid-cols-1 md:grid-cols-4 min-h-[380px] bg-background/40 text-xs font-mono">
                  {/* Sidebar mockup */}
                  <div className="border-r border-border/40 p-4 flex flex-col justify-between hidden md:flex">
                    <div className="flex flex-col gap-4">
                      <div className="font-bold text-text-primary px-2 py-1.5 bg-surface border border-border/40 rounded-sm">
                        CONSOLE HUB
                      </div>
                      <nav className="flex flex-col gap-1 text-[10px] text-text-secondary font-bold">
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer">
                          <User className="w-3.5 h-3.5" /> ATHLETES
                        </div>
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer text-text-primary bg-surface/30 rounded-sm">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> BOOKINGS
                        </div>
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer">
                          <Award className="w-3.5 h-3.5" /> BRACKETS
                        </div>
                        <div className="px-2 py-1.5 hover:text-text-primary flex items-center gap-2 cursor-pointer">
                          <Activity className="w-3.5 h-3.5" /> PROGRESS
                        </div>
                      </nav>
                    </div>
                  </div>

                  {/* Main Dashboard Widget Mockups */}
                  <div className="col-span-3 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Schedule block */}
                    <div className="bg-surface/40 p-4 border border-border rounded-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-[10px] text-text-primary flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> WEEKLY CALENDAR
                        </h4>
                        <div className="flex flex-col gap-2 text-[10px]">
                          <div className="p-2 bg-background/60 border border-border/40 rounded-sm">
                            <span className="block font-bold text-text-primary">Gi Sparring Session</span>
                            <span className="text-text-secondary">Mon 10:00 AM • Prof. Renato Silva</span>
                          </div>
                          <div className="p-2 bg-background/60 border border-border/40 rounded-sm">
                            <span className="block font-bold text-text-primary">Wrestling Takedowns</span>
                            <span className="text-text-secondary">Wed 06:00 PM • Main Mat</span>
                          </div>
                        </div>
                      </div>
                      <span className="w-full text-center py-1.5 mt-4 rounded-sm border border-border/60 text-[9px] font-bold text-text-secondary hover:text-text-primary hover:border-border transition-colors block cursor-pointer">
                        BOOK PRIVATE SLOT
                      </span>
                    </div>

                    {/* Rank block */}
                    <div className="bg-surface/40 p-4 border border-border rounded-sm flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-[10px] text-text-primary flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                          <Award className="w-3.5 h-3.5 text-primary" /> STRIPE MILESTONES
                        </h4>
                        <div className="flex flex-col gap-3 pl-2 border-l border-border/65 ml-1 text-[10px]">
                          <div>
                            <span className="block font-bold text-text-primary">Purple Belt Promotion</span>
                            <span className="text-text-tertiary">6 months ago</span>
                          </div>
                          <div>
                            <span className="block font-bold text-text-primary">1st Stripe Added</span>
                            <span className="text-text-tertiary">3 months ago</span>
                          </div>
                          <div>
                            <span className="block font-bold text-primary">2nd Stripe Evaluation</span>
                            <span className="text-text-secondary">Expected Next Week</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-[9px] text-text-secondary mb-1">
                          <span>Promotion target progress</span>
                          <span>65%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-border-strong overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar Section */}
      <StatsBar />

      {/* Signature Design Moment Section: Live Bracket Simulator */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h2
            variants={shouldReduce ? {} : fadeUp()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="text-3xl sm:text-4xl font-display font-black text-text-primary tracking-tight uppercase"
          >
            LIVE TOURNAMENT BRACKET RUNS
          </motion.h2>
          <motion.p
            variants={shouldReduce ? {} : fadeUp(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-4 text-sm text-text-secondary leading-relaxed"
          >
            Fighters register, seeds generate, and brackets update dynamically. Test our interactive simulation tool to see seed progression in action.
          </motion.p>
        </div>

        <motion.div
          variants={shouldReduce ? {} : fadeUp(0.18)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <InteractiveBracketSimulator />
        </motion.div>
      </section>

      {/* Alternating Asymmetric Feature Sections (Replaced 3-card grid) */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border/60">
        
        {/* Feature Row 1: Left Mockup, Right Text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-28">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-secondary border border-border p-5 rounded-sm shadow-inner font-mono text-xs">
              <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-2 mb-3">
                <span>COACH INSTRUCTION CALENDAR</span>
                <span className="text-primary font-bold">10:30 AM SLOT OPEN</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <span className="p-2 border border-border/40 rounded-sm bg-surface/50 text-text-tertiary line-through cursor-not-allowed">09:00 AM</span>
                <span className="p-2 border border-primary bg-primary/10 rounded-sm text-primary font-bold cursor-pointer">10:30 AM</span>
                <span className="p-2 border border-border/40 rounded-sm bg-surface text-text-primary cursor-pointer hover:border-border transition-colors">02:00 PM</span>
                <span className="p-2 border border-border/40 rounded-sm bg-surface text-text-primary cursor-pointer hover:border-border transition-colors">03:30 PM</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 flex flex-col items-start order-1 lg:order-2">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono">01. AVAILABILITY CONTROLS</span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
              AUTO-CONFIRM PRIVATE WORKSHOPS
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-xl">
              Coaches customize hourly rates, specify sparring availability times, and approve student requests instantly, eliminating back-and-forth messaging.
            </p>
            <Link href="/features" className="mt-6 inline-flex items-center text-xs font-bold text-text-primary hover:text-primary gap-1 tracking-wider uppercase font-mono">
              Explore calendar details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Feature Row 2: Left Text, Right Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono">02. MILESTONE PROGRESSION</span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-wide mt-2">
              RECORD SPARS & RANK stripe logs
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-4 max-w-xl">
              Create a permanent digital timeline of your combat career. Log sparring logs, attach video rolls, tag coaching instructors, and record belt rank advancements.
            </p>
            <Link href="/features" className="mt-6 inline-flex items-center text-xs font-bold text-text-primary hover:text-primary gap-1 tracking-wider uppercase font-mono">
              See rank metrics <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="lg:col-span-6">
            <div className="bg-secondary border border-border p-5 rounded-sm font-mono text-xs flex flex-col gap-3">
              <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-border/40 pb-2">
                <span>ATHLETE TIMELINE UPDATES</span>
                <span className="text-success font-bold">VERIFIED</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🥋</span>
                <div>
                  <span className="block font-bold text-text-primary">First Stripe on BJJ Blue Belt</span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">Approved by Head Coach Renato Silva</span>
                  <span className="text-[9px] text-text-tertiary block mt-1">1 month ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section - Clean, Specific Story */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 border-t border-border/60 bg-secondary/20">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono mb-4">
            ACADEMY REVIEW
          </span>
          <p className="text-lg sm:text-xl text-text-primary italic leading-relaxed max-w-3xl">
            "We managed our entire 400-student summer tournament bracket inside Athlix. It saved our front desk 12 hours of manual registration sorting and kept our brackets updating in real-time."
          </p>
          <div className="flex items-center gap-3.5 mt-8">
            <div className="h-10 w-10 bg-primary/20 flex items-center justify-center font-bold text-primary text-xs rounded-full font-mono uppercase border border-primary/30">
              RS
            </div>
            <div className="text-left font-mono">
              <span className="block text-xs font-bold text-text-primary uppercase">Prof. Renato Silva</span>
              <span className="block text-[10px] text-text-secondary">Head Instructor, Renzo Gracie SF</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-28 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={shouldReduce ? {} : fadeUp()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="bg-secondary border border-border rounded-sm p-8 sm:p-14 relative overflow-hidden"
        >
          <h2 className="text-2xl sm:text-4xl font-display font-black text-text-primary uppercase tracking-wide">
            Ready to track your career?
          </h2>
          <p className="mt-3 max-w-md mx-auto leading-relaxed text-xs text-text-secondary font-sans">
            Build your fighter profile, schedule calendar sessions, or coordinate brackets in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5 justify-center">
            <Link href="/signup">
              <MagneticButton variant="primary" className="py-2.5 px-6 rounded-sm text-xs font-bold font-mono tracking-wider uppercase">
                Create profile
              </MagneticButton>
            </Link>
            <Link href="/contact">
              <MagneticButton variant="ghost" className="py-2.5 px-6 rounded-sm text-xs font-bold font-mono tracking-wider uppercase">
                Email builders
              </MagneticButton>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
