'use client';

import React, { useState } from 'react';
import { Send, Image as ImageIcon, Video, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function FeedPage() {
  const { user } = useAuthStore();
  const [postContent, setPostContent] = useState('');
  
  const [posts, setPosts] = useState<any[]>([
    {
      id: '1',
      author: 'Prof. Renato Silva',
      role: 'BJJ Black Belt',
      content: 'Just finished filming technical reviews for the upcoming guard passing module. Uploading details soon to the academy portal!',
      likes: 42,
      comments: 6,
      liked: false,
      discipline: 'BJJ'
    },
    {
      id: '2',
      author: 'Coach Kru Somchai',
      role: 'Muay Thai Kru',
      content: 'Morning pad work finished with the amateur fight team. Speed checks and cardio metrics looking sharp on the charts.',
      likes: 28,
      comments: 2,
      liked: false,
      discipline: 'Muay Thai'
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
      }));
      setPosts(prev => {
        // filter out any duplicates by checking formatting
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

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-hidden">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-8 border-b border-border/60 pb-4">
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide uppercase">
            COMMUNITY ACTIVITY FEED
          </h1>
          <p className="text-text-secondary text-xs mt-1">Share spar footage and view updates from verified coaches</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Panel: Profile Quick Summary */}
          <div className="lg:col-span-1 hidden lg:block">
            <SpotlightCard className="bg-secondary p-6 border border-border rounded-sm text-center">
              <div className="h-16 w-16 rounded-sm bg-primary/10 border border-primary/25 flex items-center justify-center font-bold text-primary text-2xl font-mono mx-auto mb-4 uppercase">
                {user?.name ? user.name[0] : 'A'}
              </div>
              <h3 className="font-display font-black text-sm uppercase tracking-wide">{user?.name || 'ATHLIX FIGHTER'}</h3>
              <span className="text-[10px] font-bold text-text-secondary font-mono uppercase tracking-wider block mt-1">{user?.role || 'athlete'}</span>
              
              <hr className="border-border/40 my-4" />
              
              <div className="flex justify-around text-[10px] font-mono font-bold text-text-secondary">
                <div>
                  <span className="block text-sm font-black text-text-primary">142</span>
                  <span>FOLLOWERS</span>
                </div>
                <div>
                  <span className="block text-sm font-black text-text-primary">88</span>
                  <span>SPARS</span>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Center Panel: Create Post & Post Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Create Post Card */}
            <SpotlightCard className="bg-secondary p-5 border border-border rounded-sm">
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Publish a spar update, log weights, or seek coach reviews..."
                  rows={3}
                  className="w-full bg-surface border border-border rounded-sm p-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all resize-none font-sans"
                />
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/40">
                  <div className="flex gap-3 text-text-secondary font-mono text-[10px] font-bold">
                    <button type="button" className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer">
                      <ImageIcon className="h-4 w-4 text-primary" /> IMAGE
                    </button>
                    <button type="button" className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer">
                      <Video className="h-4 w-4 text-primary" /> VIDEO
                    </button>
                  </div>
                  <MagneticButton type="submit" className="bg-primary hover:bg-opacity-95 text-white font-bold py-2 px-4 rounded-sm text-xs font-mono tracking-wider uppercase">
                    <Send className="h-3.5 w-3.5 mr-1.5 inline" /> PUBLISH POST
                  </MagneticButton>
                </div>
              </form>
            </SpotlightCard>

            {/* Social Posts lists */}
            <div className="flex flex-col gap-6">
              {posts.map(post => (
                <SpotlightCard key={post.id} className="bg-secondary p-6 border border-border rounded-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-sm bg-primary/20 flex items-center justify-center font-bold text-primary font-mono text-xs uppercase">
                        {post.author[0]}
                      </div>
                      <div>
                        <h4 className="font-display font-black text-xs text-text-primary uppercase tracking-wide">{post.author}</h4>
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono block mt-0.5">{post.role}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-primary font-mono tracking-widest uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-sm">
                      {post.discipline}
                    </span>
                  </div>

                  <p className="text-text-secondary text-xs leading-relaxed mb-6 font-sans">
                    {post.content}
                  </p>

                  <hr className="border-border/40 my-4" />
                  
                  <div className="flex justify-between text-[10px] text-text-secondary font-mono font-bold">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer ${
                        post.liked ? 'text-primary' : ''
                      }`}
                    >
                      <Heart className="h-4 w-4" /> {post.likes} LIKES
                    </button>
                    <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {post.comments} COMMENTS</span>
                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                      <Share2 className="h-4 w-4" /> SHARE
                    </button>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Right Panel: Trending hashtags */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <SpotlightCard className="bg-secondary border border-border rounded-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-text-primary">TRENDING SPARS</h3>
              </div>
              <div className="flex flex-col gap-4">
                {trendingItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-mono border-b border-border/40 pb-3 last:border-b-0 last:pb-0 font-bold">
                    <span className="text-text-primary hover:text-primary transition-colors cursor-pointer">{item.tag}</span>
                    <span className="text-text-secondary">{item.count.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
