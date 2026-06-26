'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Video, Heart, MessageCircle, Share2, TrendingUp, Sparkles, Filter, MoreHorizontal, MessageSquare, Award } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function FeedPage() {
  const { user } = useAuthStore();
  const [postContent, setPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bjj' | 'muay thai' | 'mma'>('all');
  
  const [posts, setPosts] = useState<any[]>([
    {
      id: '1',
      author: 'Prof. Thiago Valente',
      role: 'BJJ Black Belt',
      content: 'Just finished filming technical reviews for the upcoming guard passing module. Uploading details soon to the academy portal!',
      likes: 42,
      comments: 6,
      liked: false,
      discipline: 'BJJ',
      time: '2h ago'
    },
    {
      id: '2',
      author: 'Coach Kru Somchai',
      role: 'Muay Thai Kru',
      content: 'Morning pad work finished with the amateur fight team. Speed checks and cardio metrics looking sharp on the charts.',
      likes: 28,
      comments: 2,
      liked: false,
      discipline: 'Muay Thai',
      time: '5h ago'
    }
  ]);

  const { socket, newPosts, clearNewPosts } = useSocket();

  // Listen to new posts from socket in real time
  React.useEffect(() => {
    if (newPosts && newPosts.length > 0) {
      const formatted = newPosts.map((p, idx) => ({
        id: `socket_${p._id || idx}`,
        author: p.authorId?.name || 'ATHLIX Fighter',
        role: p.authorId?.role === 'coach' ? 'Verified Coach' : 'Athlete',
        content: p.content,
        likes: p.likes?.length || 0,
        comments: p.commentsCount || 0,
        liked: false,
        discipline: 'BJJ',
        time: 'Just now'
      }));
      setPosts(prev => {
        const filteredPrev = prev.filter(p => !newPosts.some(np => `socket_${np._id}` === p.id));
        return [...formatted, ...filteredPrev];
      });
      clearNewPosts();
    }
  }, [newPosts, clearNewPosts]);

  const handleLike = (id: number | string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            likes: p.liked ? p.likes - 1 : p.likes + 1,
            liked: !p.liked
          };
        }
        return p;
      })
    );
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: postContent }),
      });
      if (res.ok) {
        setPostContent('');
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const trendingItems = [
    { tag: '#SubmissionLeague', count: '1.2K rolls' },
    { tag: '#MuayThaiPadwork', count: '840 clips' },
    { tag: '#RoadToBrownBelt', count: '412 timelines' }
  ];

  const filteredPosts = posts.filter(post => 
    selectedCategory === 'all' || post.discipline.toLowerCase() === selectedCategory
  );

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 pb-6 border-b border-border">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 inline-flex">
              <AnimatedBadge variant="accent" glow>
                <Sparkles className="w-3 h-3 mr-1.5" /> Community Connect
              </AnimatedBadge>
            </motion.div>
            <AnimatedText
              text="Fighter Activity Feed"
              className="text-4xl md:text-5xl font-black tracking-tight mb-2"
              delay={0.1}
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary text-sm"
            >
              Share updates, track training sessions, and view feed insights from verified athletes.
            </motion.p>
          </div>

          <div className="flex gap-2 bg-surface p-1 border border-border rounded-xl">
            {(['all', 'bjj', 'muay thai', 'mma'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  selectedCategory === cat
                    ? 'bg-accent text-black font-black'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Panel: Profile Quick Summary */}
          <div className="lg:col-span-1 hidden lg:block">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard variant="glow" padding="lg" className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent text-2xl font-mono mx-auto mb-4 uppercase">
                  {user?.name ? user.name[0] : 'A'}
                </div>
                <h3 className="font-bold text-base tracking-tight">{user?.name || 'ATHLIX FIGHTER'}</h3>
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mt-1">{user?.role || 'athlete'}</span>
                
                <hr className="border-border my-6" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center border-r border-border">
                    <span className="block text-xl font-black text-text-primary">142</span>
                    <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">FOLLOWERS</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-black text-text-primary">88</span>
                    <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">SPARS</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Center Panel: Create Post & Post Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Create Post Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard padding="lg">
                <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent font-mono text-sm shrink-0">
                      {user?.name ? user.name[0] : 'A'}
                    </div>
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Share your pad work, roll reviews, or system questions..."
                      rows={3}
                      className="w-full bg-surface border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                    <div className="flex gap-4 text-text-secondary text-xs font-bold">
                      <button type="button" className="hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer">
                        <ImageIcon className="h-4 w-4 text-accent" /> Media
                      </button>
                      <button type="button" className="hover:text-accent transition-colors flex items-center gap-1.5 cursor-pointer">
                        <Video className="h-4 w-4 text-accent" /> Video
                      </button>
                    </div>
                    <MagneticButton type="submit" variant="premium" size="sm">
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Publish
                    </MagneticButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>

            {/* Social Posts lists */}
            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {filteredPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <GlassCard padding="lg" variant="interactive" className="relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center font-bold text-accent font-mono text-sm uppercase">
                            {post.author[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-text-primary leading-snug">{post.author}</h4>
                            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mt-0.5">{post.role} · {post.time}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[9px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                            {post.discipline}
                          </span>
                          <button className="text-text-tertiary hover:text-text-primary transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-text-secondary text-sm leading-relaxed mb-6">
                        {post.content}
                      </p>

                      <hr className="border-border my-4" />
                      
                      <div className="flex justify-between items-center text-xs text-text-secondary font-semibold">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-2 hover:text-accent transition-colors cursor-pointer ${
                            post.liked ? 'text-accent' : ''
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${post.liked ? 'fill-accent' : ''}`} /> {post.likes} Likes
                        </button>
                        <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> {post.comments} Comments</span>
                        <button className="flex items-center gap-2 hover:text-accent transition-colors cursor-pointer">
                          <Share2 className="h-4 w-4" /> Share
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel: Trending & Achievements */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard padding="lg" className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Trending Tags</h3>
                </div>
                <div className="flex flex-col gap-4">
                  {trendingItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-border pb-3 last:border-b-0 last:pb-0">
                      <span className="text-text-secondary hover:text-accent transition-colors cursor-pointer font-medium">{item.tag}</span>
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{item.count}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <GlassCard padding="lg" variant="glow" className="flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-xl rounded-full" />
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Mat Status</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-surface rounded-xl p-3 border border-border">
                    <p className="text-[9px] text-text-tertiary uppercase tracking-widest font-mono">Current Streak</p>
                    <p className="text-base font-black text-accent mt-0.5">5 Spars This Week</p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 border border-border">
                    <p className="text-[9px] text-text-tertiary uppercase tracking-widest font-mono">Verified Level</p>
                    <p className="text-base font-black text-text-primary mt-0.5">Belt Rank: Purple</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
