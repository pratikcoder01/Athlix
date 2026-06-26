'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Trophy } from 'lucide-react';
import { DURATION, EASE_OUT_EXPO } from '../../lib/motion';

interface Athlete {
  id: string;
  name: string;
  weight: string;
  seed: string;
  team: string;
  avatar: string;
}

const initialAthletes: Athlete[] = [
  { id: '1', name: 'Thiago Valente', weight: '77 kg', seed: 'Seed 1', team: 'Apex Grappling Lab', avatar: 'TV' },
  { id: '2', name: 'Lucas Vianna', weight: '77 kg', seed: 'Seed 8', team: 'Vianna Combat Academy', avatar: 'LV' },
  { id: '3', name: 'Derek Vance', weight: '77 kg', seed: 'Seed 4', team: 'Vanguard Martial Arts', avatar: 'DV' },
  { id: '4', name: 'Rodrigo Santos', weight: '77 kg', seed: 'Seed 5', team: 'Horizon Jiu-Jitsu', avatar: 'RS' },
  { id: '5', name: 'Garrison Thorne', weight: '99 kg', seed: 'Seed 2', team: 'Aether Submission Studio', avatar: 'GT' },
  { id: '6', name: 'Mateo Brandao', weight: '99 kg', seed: 'Seed 7', team: 'Nebula Jiu-Jitsu', avatar: 'MB' },
  { id: '7', name: 'Callum Pierce', weight: '88 kg', seed: 'Seed 3', team: 'Redline Grappling', avatar: 'CP' },
  { id: '8', name: 'Alastair Sinclair', weight: '77 kg', seed: 'Seed 6', team: 'Summit Submission Academy', avatar: 'AS' },
];

const mockStats: Record<string, string> = {
  qf1: 'Valente leads head-to-head 2-0. 85% submission rate from back mount.',
  qf2: 'Santos carries 4-match submission streak. Vance has a 3-1 takedown advantage.',
  qf3: 'Thorne: 18-0 undefeated record. Brandao: 90% guard pass efficiency.',
  qf4: 'Pierce: Leg-lock specialist. Sinclair: Veteran heel hook entry master.',
  sf1: 'Projected Semifinal Matchup. Winner advances to the Gold Medal Round.',
  sf2: 'Projected Semifinal Matchup. Heavily anticipated submission battle.',
  finals: 'Championship Gold Match. Winner takes the tournament trophy.',
};

const getStats = (matchKey: string, p1: Athlete | null, p2: Athlete | null) => {
  if (!p1 || !p2) return 'Awaiting advancing athletes to generate statistics.';
  return mockStats[matchKey] || `${p1.name} vs ${p2.name}`;
};

/* ── Confetti particles for crown sequence ── */
function CrownConfetti({ active }: { active: boolean }) {
  const shouldReduce = useReducedMotion();
  if (!active || shouldReduce) return null;

  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 120,
    y: -(Math.random() * 60 + 20),
    rotate: Math.random() * 360,
    delay: Math.random() * 0.15,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-30">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate, scale: 0.3 }}
          transition={{ duration: 0.8, delay: p.delay, ease: EASE_OUT_EXPO }}
          className="absolute left-1/2 top-1/2 w-1.5 h-2 bg-accent-gold rounded-[1px]"
        />
      ))}
    </div>
  );
}

/* ── Stats tooltip via portal ── */
function StatsTooltip({
  matchKey,
  p1,
  p2,
  anchorRef,
  visible,
}: {
  matchKey: string;
  p1: Athlete | null;
  p2: Athlete | null;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!visible || !anchorRef.current) return;
    const update = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
        width: Math.max(rect.width, 220),
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [visible, anchorRef]);

  if (!mounted || !visible) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: DURATION.fast }}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        transform: 'translateX(-50%)',
        width: pos.width,
        zIndex: 9999,
      }}
      className="bg-surface border border-accent-gold/40 p-3 rounded-sm shadow-xl font-mono text-[9px] text-text-secondary leading-relaxed pointer-events-none"
    >
      <div className="text-[8px] font-bold text-primary mb-1 uppercase tracking-widest font-sans">
        Matchup Statistics
      </div>
      {getStats(matchKey, p1, p2)}
    </motion.div>,
    document.body
  );
}

const AthleteSlot: React.FC<{
  athlete: Athlete | null;
  isSelected: boolean;
  isOpponentSelected: boolean;
  onClick: () => void;
}> = ({ athlete, isSelected, isOpponentSelected, onClick }) => {
  if (!athlete) {
    return (
      <div className="flex items-center p-3 min-h-12 bg-surface/30 border border-dashed border-border/20 text-text-tertiary text-[10px] italic">
        Awaiting advancement
      </div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      animate={
        isSelected
          ? {
              borderColor: ['var(--accent-gold)', 'var(--accent-gold)'],
              boxShadow: [
                '0 0 0px rgba(201,162,39,0)',
                '0 0 12px rgba(201,162,39,0.35)',
              ],
            }
          : {}
      }
      transition={{ duration: DURATION.fast }}
      className={`flex items-center justify-between gap-2 p-3 min-h-12 border cursor-pointer select-none transition-all ${
        isSelected
          ? 'bg-primary/10 border-accent-gold text-text-primary font-semibold'
          : isOpponentSelected
          ? 'bg-surface/20 border-border/40 text-text-secondary opacity-65 hover:opacity-100'
          : 'bg-surface/90 border-border text-text-primary hover:border-primary/50'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 tabular-data ${
            isSelected
              ? 'bg-primary text-white border border-accent-gold/50'
              : 'bg-secondary text-text-secondary border border-border'
          }`}
        >
          {athlete.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className="block text-[clamp(9px,1.8vw,11px)] uppercase tracking-wide leading-tight break-words"
            style={{ wordBreak: 'break-word' }}
          >
            {athlete.name}
          </span>
          <span className="block text-[8px] text-text-secondary tabular-data">
            {athlete.weight} • {athlete.seed}
          </span>
        </div>
      </div>
      {isSelected && (
        <span className="text-[8px] font-bold text-accent-gold tracking-widest font-mono shrink-0 flex items-center gap-0.5">
          ADV <CheckCircle2 className="h-3 w-3 text-accent-gold" aria-hidden="true" />
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
  activeMatch: string | null;
  setActiveMatch: (key: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({
  matchKey,
  title,
  p1,
  p2,
  winner,
  onSelectWinner,
  activeMatch,
  setActiveMatch,
  className = '',
  style,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isActive = activeMatch === matchKey;
  const showStats = isHovered || isActive;

  const toggleStats = () => setActiveMatch(isActive ? null : matchKey);

  return (
    <div
      ref={boxRef}
      id={`match-${matchKey}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full min-w-[200px] max-w-[240px] bg-secondary/60 rounded-sm border border-border shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${className}`}
      style={style}
    >
      <button
        type="button"
        onClick={toggleStats}
        className="w-full bg-surface/95 border-b border-border/80 px-3 py-1.5 flex justify-between items-center text-[9px] font-bold text-text-secondary uppercase font-mono tracking-wider cursor-pointer hover:text-text-primary transition-colors"
        aria-expanded={isActive}
      >
        <span>{title}</span>
        <span className="text-[8px] text-text-tertiary">
          {showStats ? '▲ STATS' : '▼ STATS'}
        </span>
      </button>

      <div className="flex flex-col">
        <AthleteSlot
          athlete={p1}
          isSelected={winner !== null && winner.id === p1?.id}
          isOpponentSelected={winner !== null && winner.id !== p1?.id}
          onClick={() => p1 && onSelectWinner(p1)}
        />
        <div className="h-px bg-border/40" />
        <AthleteSlot
          athlete={p2}
          isSelected={winner !== null && winner.id === p2?.id}
          isOpponentSelected={winner !== null && winner.id !== p2?.id}
          onClick={() => p2 && onSelectWinner(p2)}
        />
      </div>

      {winner && (
        <div className="px-3 py-1 text-[8px] font-mono font-bold text-primary uppercase tracking-wider border-t border-border/40">
          Advanced
        </div>
      )}

      <AnimatePresence>
        {showStats && (
          <StatsTooltip
            matchKey={matchKey}
            p1={p1}
            p2={p2}
            anchorRef={boxRef}
            visible={showStats}
          />
        )}
      </AnimatePresence>

      {/* Mobile inline stats panel */}
      {isActive && (
        <div className="md:hidden border-t border-accent-gold/30 bg-surface/80 p-3 font-mono text-[9px] text-text-secondary leading-relaxed">
          <div className="text-[8px] font-bold text-primary mb-1 uppercase tracking-widest">
            Matchup Statistics
          </div>
          {getStats(matchKey, p1, p2)}
        </div>
      )}
    </div>
  );
};

const ChampionBox: React.FC<{
  champion: Athlete | null;
  crownJustSet: boolean;
}> = ({ champion, crownJustSet }) => {
  const shouldReduce = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center text-center relative">
      <div className="text-[9px] font-bold tracking-widest text-text-secondary uppercase font-mono mb-3">
        Champion
      </div>
      <AnimatePresence mode="wait">
        {champion ? (
          <motion.div
            key={champion.id}
            initial={shouldReduce ? { opacity: 1 } : { scale: 0.85, opacity: 0, y: 10 }}
            animate={
              shouldReduce
                ? { scale: 1, opacity: 1, y: 0 }
                : {
                    scale: [0.85, 1.02, 1],
                    opacity: 1,
                    y: 0,
                  }
            }
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: DURATION.signature, ease: EASE_OUT_EXPO }}
            className={`bg-accent-gold/10 border border-accent-gold p-4 rounded-sm w-full min-w-[200px] max-w-[240px] flex flex-col items-center relative ${
              crownJustSet && !shouldReduce ? 'crown-burst' : ''
            }`}
          >
            <CrownConfetti active={crownJustSet} />
            <motion.div
              initial={shouldReduce ? {} : { y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: DURATION.base, ease: EASE_OUT_EXPO }}
            >
              <Trophy className="h-8 w-8 text-accent-gold mb-2" aria-hidden="true" />
            </motion.div>
            <span className="text-[9px] font-bold font-mono tracking-widest text-accent-gold uppercase">
              Gold Medalist
            </span>
            <span className="text-sm font-display font-black text-text-primary tracking-wide uppercase mt-1 text-center break-words w-full">
              {champion.name}
            </span>
            <span className="text-[9px] text-text-secondary mt-0.5 break-words w-full text-center">
              {champion.team}
            </span>
          </motion.div>
        ) : (
          <div className="w-full min-w-[200px] max-w-[240px] min-h-[115px] border border-dashed border-border-strong/30 rounded-sm flex items-center justify-center text-text-tertiary italic text-[11px] px-4 text-center bg-surface/20">
            Advance fighters to crown champion
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function InteractiveBracketSimulator() {
  const [qfWinners, setQfWinners] = useState<(Athlete | null)[]>([null, null, null, null]);
  const [sfWinners, setSfWinners] = useState<(Athlete | null)[]>([null, null]);
  const [champion, setChampion] = useState<Athlete | null>(null);
  const [crownJustSet, setCrownJustSet] = useState(false);
  const [activeMatch, setActiveMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'qf' | 'sf' | 'finals'>('qf');
  const shouldReduce = useReducedMotion();

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
      setCrownJustSet(false);
    }
  };

  const handleSfWinner = (index: number, winner: Athlete) => {
    const nextSfWinners = [...sfWinners];
    const prevWinner = nextSfWinners[index];
    nextSfWinners[index] = winner;
    setSfWinners(nextSfWinners);
    if (prevWinner && prevWinner.id !== winner.id) {
      setChampion(null);
      setCrownJustSet(false);
    }
  };

  const handleChampion = (winner: Athlete) => {
    setChampion(winner);
    setCrownJustSet(true);
    setTimeout(() => setCrownJustSet(false), 1200);
  };

  const resetBracket = () => {
    setQfWinners([null, null, null, null]);
    setSfWinners([null, null]);
    setChampion(null);
    setCrownJustSet(false);
    setActiveMatch(null);
  };

  const qfMatchups = [
    { p1: initialAthletes[0], p2: initialAthletes[1], title: 'Quarterfinal 1', key: 'qf1', index: 0 },
    { p1: initialAthletes[2], p2: initialAthletes[3], title: 'Quarterfinal 2', key: 'qf2', index: 1 },
    { p1: initialAthletes[4], p2: initialAthletes[5], title: 'Quarterfinal 3', key: 'qf3', index: 2 },
    { p1: initialAthletes[6], p2: initialAthletes[7], title: 'Quarterfinal 4', key: 'qf4', index: 3 },
  ];

  const sfMatchups = [
    { p1: qfWinners[0], p2: qfWinners[1], title: 'Semifinal 1', key: 'sf1', index: 0 },
    { p1: qfWinners[2], p2: qfWinners[3], title: 'Semifinal 2', key: 'sf2', index: 1 },
  ];

  const finalsMatchup = {
    p1: sfWinners[0],
    p2: sfWinners[1],
    title: 'Championship Final',
    key: 'finals',
  };

  const lineColor = (active: boolean) =>
    active ? (champion ? 'var(--accent-gold)' : 'var(--primary)') : 'var(--border-strong)';

  const pathTransition = shouldReduce
    ? { duration: 0 }
    : { duration: 0.6, ease: EASE_OUT_EXPO };

  return (
    <div className="w-full bg-secondary/80 border border-border rounded-sm p-6 sm:p-8 relative">
      <div className="absolute inset-0 bracket-dots pointer-events-none opacity-40" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono">
            Signature Interactive Tournament
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-black text-text-primary tracking-wide uppercase mt-1 display-skew inline-block">
            <span>Test the Bracket Matchmaker</span>
          </h3>
          <p className="text-xs text-text-secondary mt-2 max-w-lg">
            Tap athletes to advance seeds round-by-round. Tap or hover a match header to view matchup statistics.
          </p>
        </div>
        <button
          onClick={resetBracket}
          className="text-xs font-mono font-bold tracking-wider text-text-secondary hover:text-primary transition-colors border border-border px-3 py-1.5 rounded-sm bg-surface cursor-pointer focus-visible:ring-2 focus-visible:ring-primary shrink-0"
        >
          Reset Bracket
        </button>
      </div>

      {/* Desktop Tree View */}
      <div className="hidden md:block overflow-x-auto py-8">
        <div className="relative w-[1080px] h-[530px] mx-auto">
          <svg className="absolute inset-0 pointer-events-none w-[1080px] h-[530px]" viewBox="0 0 1080 530" fill="none">
            <motion.path
              d="M 220 70 H 260 V 135 H 300"
              stroke={lineColor(!!qfWinners[0])}
              strokeWidth="1.5"
              animate={{ pathLength: 1, stroke: lineColor(!!qfWinners[0]) }}
              initial={{ pathLength: 0 }}
              transition={pathTransition}
            />
            <motion.path
              d="M 220 200 H 260 V 135 H 300"
              stroke={lineColor(!!qfWinners[0])}
              strokeWidth="1.5"
              animate={{ pathLength: 1, stroke: lineColor(!!qfWinners[0]) }}
              transition={pathTransition}
            />
            <motion.path
              d="M 220 330 H 260 V 395 H 300"
              stroke={lineColor(!!qfWinners[1])}
              strokeWidth="1.5"
              animate={{ pathLength: 1, stroke: lineColor(!!qfWinners[1]) }}
              transition={pathTransition}
            />
            <motion.path
              d="M 220 460 H 260 V 395 H 300"
              stroke={lineColor(!!qfWinners[1])}
              strokeWidth="1.5"
              animate={{ pathLength: 1, stroke: lineColor(!!qfWinners[1]) }}
              transition={pathTransition}
            />
            <motion.path
              d="M 480 135 H 520 V 265 H 560"
              stroke={lineColor(!!sfWinners[0])}
              strokeWidth="1.5"
              animate={{ pathLength: 1, stroke: lineColor(!!sfWinners[0]) }}
              transition={pathTransition}
            />
            <motion.path
              d="M 480 395 H 520 V 265 H 560"
              stroke={lineColor(!!sfWinners[1])}
              strokeWidth="1.5"
              animate={{ pathLength: 1, stroke: lineColor(!!sfWinners[1]) }}
              transition={pathTransition}
            />
            <motion.path
              d="M 740 265 H 820"
              stroke={lineColor(!!champion)}
              strokeWidth="2"
              animate={{ pathLength: 1, stroke: lineColor(!!champion) }}
              transition={pathTransition}
            />
          </svg>

          {qfMatchups.map((m, idx) => (
            <MatchBox
              key={m.key}
              matchKey={m.key}
              title={m.title}
              p1={m.p1}
              p2={m.p2}
              winner={qfWinners[m.index]}
              onSelectWinner={(w) => handleQfWinner(m.index, w)}
              activeMatch={activeMatch}
              setActiveMatch={setActiveMatch}
              className="absolute"
              style={{ left: '20px', top: `${20 + idx * 130}px` }}
            />
          ))}

          {sfMatchups.map((m, idx) => (
            <MatchBox
              key={m.key}
              matchKey={m.key}
              title={m.title}
              p1={m.p1}
              p2={m.p2}
              winner={sfWinners[m.index]}
              onSelectWinner={(w) => handleSfWinner(m.index, w)}
              activeMatch={activeMatch}
              setActiveMatch={setActiveMatch}
              className="absolute"
              style={{ left: '300px', top: `${85 + idx * 260}px` }}
            />
          ))}

          <MatchBox
            matchKey={finalsMatchup.key}
            title={finalsMatchup.title}
            p1={finalsMatchup.p1}
            p2={finalsMatchup.p2}
            winner={champion}
            onSelectWinner={handleChampion}
            activeMatch={activeMatch}
            setActiveMatch={setActiveMatch}
            className="absolute"
            style={{ left: '560px', top: '215px' }}
          />

          <div className="absolute left-[820px] top-[195px] flex justify-center">
            <ChampionBox champion={champion} crownJustSet={crownJustSet} />
          </div>
        </div>
      </div>

      {/* Mobile Tabbed View */}
      <div className="block md:hidden">
        <div className="flex border-b border-border/80 mb-6">
          {(['qf', 'sf', 'finals'] as const).map((tab) => {
            const label = tab === 'qf' ? 'Quarterfinals' : tab === 'sf' ? 'Semifinals' : 'Finals & Champ';
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center text-[10px] font-mono font-bold tracking-wider uppercase border-b-2 transition-colors cursor-pointer ${
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
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: DURATION.fast }}
              className="flex flex-col gap-4 items-center"
            >
              {qfMatchups.map((m) => (
                <MatchBox
                  key={m.key}
                  matchKey={m.key}
                  title={m.title}
                  p1={m.p1}
                  p2={m.p2}
                  winner={qfWinners[m.index]}
                  onSelectWinner={(w) => handleQfWinner(m.index, w)}
                  activeMatch={activeMatch}
                  setActiveMatch={setActiveMatch}
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'sf' && (
            <motion.div
              key="sf-view"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: DURATION.fast }}
              className="flex flex-col gap-4 items-center"
            >
              {sfMatchups.map((m) => (
                <MatchBox
                  key={m.key}
                  matchKey={m.key}
                  title={m.title}
                  p1={m.p1}
                  p2={m.p2}
                  winner={sfWinners[m.index]}
                  onSelectWinner={(w) => handleSfWinner(m.index, w)}
                  activeMatch={activeMatch}
                  setActiveMatch={setActiveMatch}
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'finals' && (
            <motion.div
              key="finals-view"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: DURATION.fast }}
              className="flex flex-col gap-6 items-center"
            >
              <MatchBox
                matchKey={finalsMatchup.key}
                title={finalsMatchup.title}
                p1={finalsMatchup.p1}
                p2={finalsMatchup.p2}
                winner={champion}
                onSelectWinner={handleChampion}
                activeMatch={activeMatch}
                setActiveMatch={setActiveMatch}
              />
              <div className="h-px w-full max-w-[280px] bg-border/40" />
              <ChampionBox champion={champion} crownJustSet={crownJustSet} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
