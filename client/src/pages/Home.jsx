import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Swords, Calendar, MessageSquare, Award, Play } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      {/* Hero Section */}
      <div className="text-center py-16 md:py-24">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
          Elevate Your <span className="bg-gradient-to-r from-dojo-primary to-gold bg-clip-text text-transparent">Martial Arts</span> Journey
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-dojo-muted md:text-xl">
          DojoPro is the sports-tech platform connecting athletes, coaches, and tournaments in one unified community. Track belt progression, share training footage, and schedule 1-on-1 coaching sessions.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          {user ? (
            <Link
              to="/feed"
              className="rounded-md bg-dojo-primary px-8 py-3.5 text-base font-semibold text-white shadow-glow-red hover:bg-opacity-90 transition duration-200"
            >
              Enter Dojo Community
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="rounded-md bg-dojo-primary px-8 py-3.5 text-base font-semibold text-white shadow-glow-red hover:bg-opacity-90 transition duration-200"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="text-base font-semibold text-white hover:text-dojo-primary transition duration-200"
              >
                Log In <span aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="mt-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Platform Features</h2>
          <p className="mt-4 text-dojo-muted">Everything a modern martial artist needs to level up.</p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Track progression */}
          <div className="glass-panel rounded-xl p-6 hover:border-dojo-primary transition duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dojo-primary bg-opacity-20 text-dojo-primary">
              <Award size={24} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Belt Progression</h3>
            <p className="mt-2 text-sm text-dojo-muted">
              Log your training hours, achievements, and track milestones as you advance to your next rank.
            </p>
          </div>

          {/* Card 2: Discover coaches */}
          <div className="glass-panel rounded-xl p-6 hover:border-dojo-primary transition duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dojo-primary bg-opacity-20 text-dojo-primary">
              <Swords size={24} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Sensei Discovery</h3>
            <p className="mt-2 text-sm text-dojo-muted">
              Filter by discipline and rank to find elite coaches. Inspect bios, reviews, and video reels.
            </p>
          </div>

          {/* Card 3: Booking dashboard */}
          <div className="glass-panel rounded-xl p-6 hover:border-dojo-primary transition duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dojo-primary bg-opacity-20 text-dojo-primary">
              <Calendar size={24} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Coaching Bookings</h3>
            <p className="mt-2 text-sm text-dojo-muted">
              Request training slots directly with coaches. Keep track of approvals, pending requests, and upcoming mat sessions.
            </p>
          </div>

          {/* Card 4: Community feed */}
          <div className="glass-panel rounded-xl p-6 hover:border-dojo-primary transition duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dojo-primary bg-opacity-20 text-dojo-primary">
              <MessageSquare size={24} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Community Feed</h3>
            <p className="mt-2 text-sm text-dojo-muted">
              Share your training updates, like/unlike posts, comment on techniques, and engage with fellow martial artists.
            </p>
          </div>

          {/* Card 5: Video reels */}
          <div className="glass-panel rounded-xl p-6 hover:border-dojo-primary transition duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dojo-primary bg-opacity-20 text-dojo-primary">
              <Play size={24} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Training Reels</h3>
            <p className="mt-2 text-sm text-dojo-muted">
              Upload spar recordings, sparring footage, or kata practices directly to Cloudinary and pin them to your profile.
            </p>
          </div>

          {/* Card 6: Tournaments */}
          <div className="glass-panel rounded-xl p-6 hover:border-dojo-primary transition duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dojo-primary bg-opacity-20 text-dojo-primary">
              <Shield size={24} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Tournament Portal</h3>
            <p className="mt-2 text-sm text-dojo-muted">
              Browse upcoming martial arts tournaments, inspect details and requirements, and register with a single click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
