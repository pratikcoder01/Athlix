import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Award, Zap } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-athlix-dark text-athlix-text py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-6xl font-extrabold text-athlix-primary font-bebas tracking-wide">
            WE ARE ATHLIX
          </h1>
          <p className="mt-4 text-xl text-athlix-muted max-w-3xl mx-auto">
            The next-generation sports-tech foundation designed to connect, train, and level up combat sports athletes, coaches, academies, and tournament organizers.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Users className="h-8 w-8 text-athlix-primary" />,
              title: "Unified Community",
              desc: "Connecting athletes of all disciplines from BJJ to Muay Thai with premier coaching academies."
            },
            {
              icon: <Zap className="h-8 w-8 text-athlix-secondary" />,
              title: "Real-Time Bookings",
              desc: "Schedule private 1-on-1 sessions instantly. Coaches manage calendars, athletes level up."
            },
            {
              icon: <Award className="h-8 w-8 text-athlix-success" />,
              title: "Tournament Registry",
              desc: "Seamless tournament signup, bracket Generation, and live result tracking."
            },
            {
              icon: <Shield className="h-8 w-8 text-athlix-primary" />,
              title: "Verified Credentials",
              desc: "Academy owners and coaches are verified to ensure quality instruction."
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-athlix-card border border-athlix-border p-6 rounded-lg shadow-lg hover:border-athlix-primary transition-all duration-300"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold text-athlix-text mb-2 font-bebas tracking-wider">{item.title}</h3>
              <p className="text-athlix-muted text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-16 bg-athlix-card border border-athlix-border rounded-lg p-8 sm:p-12 text-center max-w-4xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-athlix-text font-bebas tracking-wider mb-4">
            Evolve Your Combat Journey
          </h2>
          <p className="text-athlix-muted leading-relaxed mb-6">
            ATHLIX combines the networking capacity of professional platforms with specific combat sports utilities like rank progression tracking, digital match history, and scheduling tools.
          </p>
          <a
            href="/signup"
            className="inline-block bg-athlix-primary hover:bg-opacity-95 text-athlix-text font-bold px-8 py-3 rounded-md transition-all duration-300 font-bebas tracking-widest"
          >
            JOIN ATHLIX TODAY
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
