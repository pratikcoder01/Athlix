'use client';

import React, { useState } from 'react';
import { Send, Image as ImageIcon, Video, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import SpotlightCard from '../../components/shared/SpotlightCard';
import MagneticButton from '../../components/shared/MagneticButton';
import { useAuthStore } from '../../store/authStore';

export default function FeedPage() {
  const { user } = useAuthStore();
  const [postContent, setPostContent] = useState('');
  
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Prof. Renato Silva',
      role: 'BJJ Black Belt',
      content: 'Just finished filming technical reviews for the upcoming guard passing module. Uploading details soon to the academy portal!',
      likes: 42,
      comments: 6,
      liked: false,
      discipline: 'BJJ'
    },
    {
      id: 2,
      author: 'Coach Kru Somchai',
      role: 'Muay Thai Kru',
      content: 'Morning pad work finished with the amateur fight team. Speed checks and cardio metrics looking sharp on the charts.',
      likes: 28,
      comments: 2,
      liked: false,
      discipline: 'Muay Thai'
    }
  ]);

  const handleLike = (id: number) => {
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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const newPost = {
      id: posts.length + 1,
      author: user?.name || 'Athlete Fighter',
      role: 'BJJ Purple Belt',
      content: postContent,
      likes: 0,
      comments: 0,
      liked: false,
      discipline: 'BJJ'
    };

    setPosts([newPost, ...posts]);
    setPostContent('');
  };

  const trendingItems = [
    { tag: '#SubmissionLeague', count: '1.2K rolls' },
    { tag: '#MuayThaiPadwork', count: '840 clips' },
    { tag: '#RoadToBrownBelt', count: '412 timelines' }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary transition-colors duration-300">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Panel: Profile Quick Summary */}
          <div className="lg:col-span-1 hidden lg:block">
            <SpotlightCard className="bg-secondary p-6 border border-border text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-3xl font-mono mx-auto mb-4 uppercase">
                {user?.name ? user.name[0] : 'A'}
              </div>
              <h3 className="font-bold text-lg uppercase tracking-wide">{user?.name || 'ATHLIX FIGHTER'}</h3>
              <span className="text-xs font-bold text-text-secondary font-mono uppercase tracking-wider">{user?.role || 'athlete'}</span>
              <hr className="border-border my-4" />
              <div className="flex justify-around text-xs font-mono text-text-secondary">
                <div>
                  <span className="block font-bold text-text-primary">142</span>
                  <span>FOLLOWERS</span>
                </div>
                <div>
                  <span className="block font-bold text-text-primary">88</span>
                  <span>SPARS</span>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Center Panel: Create Post & Post Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Create Post Card */}
            <SpotlightCard className="bg-secondary p-5 border border-border">
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share a spar highlight, ask coaching advice..."
                  rows={3}
                  className="w-full bg-surface border border-border rounded p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-all resize-none"
                />
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                  <div className="flex gap-3 text-text-secondary">
                    <button type="button" className="hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <ImageIcon className="h-4.5 w-4.5" /> Photo
                    </button>
                    <button type="button" className="hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <Video className="h-4.5 w-4.5" /> Video
                    </button>
                  </div>
                  <MagneticButton type="submit" className="bg-primary hover:bg-opacity-95 text-white font-bold py-2 px-5 rounded text-xs font-bebas tracking-widest">
                    <Send className="h-3.5 w-3.5 mr-1 inline" /> PUBLISH POST
                  </MagneticButton>
                </div>
              </form>
            </SpotlightCard>

            {/* Social Posts lists */}
            <div className="flex flex-col gap-6">
              {posts.map(post => (
                <SpotlightCard key={post.id} className="bg-secondary p-6 border border-border">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary font-mono text-sm uppercase">
                        {post.author[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text-primary uppercase tracking-wide">{post.author}</h4>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">{post.role}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-primary font-mono tracking-widest uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                      {post.discipline}
                    </span>
                  </div>

                  <p className="text-text-secondary text-sm leading-relaxed mb-6">
                    {post.content}
                  </p>

                  <hr className="border-border my-4" />
                  
                  <div className="flex justify-between text-xs text-text-secondary font-mono">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer font-semibold ${
                        post.liked ? 'text-primary' : ''
                      }`}
                    >
                      <Heart className="h-4.5 w-4.5" /> {post.likes} Likes
                    </button>
                    <span className="flex items-center gap-1.5"><MessageCircle className="h-4.5 w-4.5" /> {post.comments} Comments</span>
                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer font-semibold">
                      <Share2 className="h-4.5 w-4.5" /> Share
                    </button>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Right Panel: Trending hashtags and search */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <SpotlightCard className="bg-secondary border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold font-display uppercase tracking-wide">trending spars</h3>
              </div>
              <div className="flex flex-col gap-4">
                {trendingItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-mono border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <span className="font-bold text-text-primary hover:text-primary transition-colors cursor-pointer">{item.tag}</span>
                    <span className="text-text-secondary">{item.count}</span>
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
