'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Image as ImageIcon, Video, Heart, MessageSquare,
  Share2, TrendingUp, Sparkles, MoreHorizontal, Award, Users
} from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';
import { cn } from '../../lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const disciplineColors: Record<string, string> = {
  BJJ: 'bg-purple-400/15 text-purple-400 border-purple-400/25',
  'Muay Thai': 'bg-red-400/15 text-red-400 border-red-400/25',
  MMA: 'bg-orange-400/15 text-orange-400 border-orange-400/25',
};

const avatarColors = [
  'from-accent to-accent-light',
  'from-purple-500 to-violet-600',
  'from-blue-500 to-indigo-600',
  'from-orange-500 to-red-500',
  'from-green-500 to-emerald-600',
];

export default function FeedPage() {
  const { user } = useAuthStore();
  const [postContent, setPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bjj' | 'muay thai' | 'mma'>('all');

  const [posts, setPosts] = useState<{
    id: string; author: string; role: string; content: string;
    likes: number; comments: number; liked: boolean; discipline: string; time: string;
  }[]>([
    { id: '1', author: 'Prof. Thiago Valente', role: 'BJJ Black Belt', content: 'Just finished filming technical reviews for the upcoming guard passing module. Uploading details soon to the academy portal!', likes: 42, comments: 6, liked: false, discipline: 'BJJ', time: '2h ago' },
    { id: '2', author: 'Coach Kru Somchai', role: 'Muay Thai Kru', content: 'Morning pad work finished with the amateur fight team. Speed checks and cardio metrics looking sharp on the charts.', likes: 28, comments: 2, liked: false, discipline: 'Muay Thai', time: '5h ago' },
  ]);

  const { newPosts, clearNewPosts } = useSocket();

  React.useEffect(() => {
    if (newPosts && newPosts.length > 0) {
      const formatted = newPosts.map((p: { _id?: string; authorId?: { name?: string; role?: string }; content?: string; likes?: unknown[]; commentsCount?: number }, idx: number) => ({
        id: `socket_${p._id || idx}`,
        author: p.authorId?.name || 'ATHLIX Fighter',
        role: p.authorId?.role === 'coach' ? 'Verified Coach' : 'Athlete',
        content: p.content || '',
        likes: p.likes?.length || 0,
        comments: p.commentsCount || 0,
        liked: false,
        discipline: 'BJJ',
        time: 'Just now',
      }));
      setPosts(prev => {
        const filteredPrev = prev.filter(p => !newPosts.some((np: { _id?: string }) => `socket_${np._id}` === p.id));
        return [...formatted, ...filteredPrev];
      });
      clearNewPosts();
    }
  }, [newPosts, clearNewPosts]);

  const handleLike = (id: string) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked } : p
    ));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: postContent }),
      });
      if (res.ok) setPostContent('');
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const trendingItems = [
    { tag: '#SubmissionLeague', count: '1.2K rolls' },
    { tag: '#MuayThaiPadwork', count: '840 clips' },
    { tag: '#RoadToBrownBelt', count: '412 timelines' },
  ];

  const filteredPosts = posts.filter(post =>
    selectedCategory === 'all' || post.discipline.toLowerCase() === selectedCategory
  );

  const userInitial = user?.name ? user.name[0].toUpperCase() : 'A';

  const categories = ['all', 'bjj', 'muay thai', 'mma'] as const;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 pb-8 border-b border-border">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/8 text-accent text-xs font-semibold mb-4"
            >
              <Sparkles className="w-3 h-3" /> Community Connect
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="text-4xl md:text-5xl font-extrabold font-display tracking-tight text-text-primary mb-2"
            >
              Fighter Activity Feed
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-text-secondary text-sm"
            >
              Share updates, track training sessions, and view insights from verified athletes.
            </motion.p>
          </div>

          {/* Category Filter */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="flex bg-surface border border-border rounded-full p-1"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200',
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-accent to-accent-light text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Left: Profile Card ── */}
          <div className="lg:col-span-1 hidden lg:block">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-surface p-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center font-extrabold text-white text-xl mx-auto mb-4">
                {userInitial}
              </div>
              <h3 className="font-bold text-base text-text-primary">{user?.name || 'ATHLIX FIGHTER'}</h3>
              <p className="text-xs text-text-tertiary uppercase tracking-widest mt-1 capitalize">{user?.role || 'athlete'}</p>

              <div className="h-px bg-border my-5" />

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <span className="block text-xl font-extrabold text-text-primary">142</span>
                  <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Followers</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-extrabold text-text-primary">88</span>
                  <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Spars</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Center: Create Post + Feed ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Create Post */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center font-extrabold text-white text-sm shrink-0">
                    {userInitial}
                  </div>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share your pad work, roll reviews, or system questions..."
                    rows={3}
                    className="w-full bg-surface-elevated border border-border rounded-xl p-3.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                  />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <div className="flex gap-4 text-text-secondary text-xs font-semibold">
                    <button type="button" className="hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer">
                      <ImageIcon className="h-3.5 w-3.5 text-accent" /> Media
                    </button>
                    <button type="button" className="hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer">
                      <Video className="h-3.5 w-3.5 text-accent" /> Video
                    </button>
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-accent to-accent-light text-white text-xs font-bold shadow-md shadow-accent/20 hover:shadow-accent/35 transition-all cursor-pointer"
                  >
                    <Send className="h-3 w-3" /> Publish
                  </motion.button>
                </div>
              </form>
            </motion.div>

            {/* Post Feed */}
            <AnimatePresence>
              {filteredPosts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05, duration: 0.4, ease: 'easeOut' }}
                  className="rounded-2xl border border-border bg-surface p-5 hover:border-accent/20 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center font-extrabold text-white text-sm shrink-0', avatarColors[idx % avatarColors.length])}>
                        {post.author[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-text-primary leading-snug">{post.author}</h4>
                        <span className="text-[10px] text-text-tertiary">{post.role} · {post.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full border', disciplineColors[post.discipline] || 'bg-surface text-text-secondary border-border')}>
                        {post.discipline}
                      </span>
                      <button className="text-text-tertiary hover:text-text-primary transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-text-secondary text-sm leading-relaxed mb-4">{post.content}</p>

                  <div className="h-px bg-border mb-4" />

                  <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={cn('flex items-center gap-1.5 hover:text-accent transition-colors cursor-pointer', post.liked && 'text-accent')}
                    >
                      <Heart className={cn('h-4 w-4', post.liked && 'fill-accent')} />
                      {post.likes} Likes
                    </button>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" /> {post.comments} Comments
                    </span>
                    <button className="flex items-center gap-1.5 hover:text-accent transition-colors cursor-pointer">
                      <Share2 className="h-4 w-4" /> Share
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Right: Trending + Mat Status ── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Trending */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Trending Tags</h3>
              </div>
              <div className="space-y-3">
                {trendingItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border-b border-border pb-3 last:border-0 last:pb-0">
                    <span className="text-text-secondary hover:text-accent transition-colors cursor-pointer font-medium">{item.tag}</span>
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{item.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mat Status */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl border border-border bg-surface p-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/8 blur-2xl rounded-full pointer-events-none" />
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Award className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Mat Status</h3>
              </div>
              <div className="space-y-3 relative z-10">
                <div className="bg-surface-elevated rounded-xl p-3.5 border border-border">
                  <p className="text-[9px] text-text-tertiary uppercase tracking-widest font-medium mb-1">Current Streak</p>
                  <p className="text-base font-extrabold text-accent">5 Spars This Week</p>
                </div>
                <div className="bg-surface-elevated rounded-xl p-3.5 border border-border">
                  <p className="text-[9px] text-text-tertiary uppercase tracking-widest font-medium mb-1">Verified Level</p>
                  <p className="text-base font-extrabold text-text-primary">Belt Rank: Purple</p>
                </div>
              </div>
            </motion.div>

            {/* Active Athletes */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-green-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Active Now</h3>
                <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/25">LIVE</span>
              </div>
              <div className="flex -space-x-2">
                {['TV', 'KS', 'MR', 'EW', 'AR'].map((av, i) => (
                  <div key={i} className={cn('w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-white text-[9px] font-extrabold', avatarColors[i])}>
                    {av}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-background bg-surface-elevated flex items-center justify-center text-text-tertiary text-[9px] font-bold">
                  +24
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
