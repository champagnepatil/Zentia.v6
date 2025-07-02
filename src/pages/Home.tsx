import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import WaitlistCTA from '../components/waitlist/WaitlistCTA';
import NotificationHistory from '../components/waitlist/NotificationHistory';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Brain, Shield, Clock, Users, ArrowRight, Bell, LogIn } from 'lucide-react';
import { HeroWithMockup } from "../components/blocks/hero-with-mockup";
import { FeaturesSectionWithCardGradient } from "../components/blocks/feature-section-with-card-gradient";
import { CTA } from "../components/ui/call-to-action";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Check if user is admin (you can modify this logic based on your admin criteria)
  const isAdmin = user?.email?.includes('admin') || 
                  user?.email?.includes('l.de.angelis') || 
                  user?.role === 'admin' ||
                  false; // Add your admin check logic here

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      {/* Hero Section */}
      <HeroWithMockup
        title="Welcome to Zentia"
        description="Your AI-powered therapy companion."
        mockupImage={{
          src: "/logo.svg",
          alt: "Zentia App Mockup",
          width: 600,
          height: 400,
        }}
        primaryCta={{ text: "Get Started", href: "/register" }}
        secondaryCta={{ text: "Learn More", href: "/about" }}
      />

      {/* Features Section */}
      <FeaturesSectionWithCardGradient />

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-neutral-800 mb-8">Always There When You Need Support</h2>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mr-6 mt-2 flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-3">24/7 Availability</h3>
                    <p className="text-neutral-600 leading-relaxed">Get support whenever you need it, not just during therapy hours.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-secondary-100 rounded-2xl flex items-center justify-center mr-6 mt-2 flex-shrink-0">
                    <Brain className="w-6 h-6 text-secondary-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-3">Contextual Understanding</h3>
                    <p className="text-neutral-600 leading-relaxed">AI that remembers your therapy sessions and provides relevant, personalized guidance.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mr-6 mt-2 flex-shrink-0">
                    <Shield className="w-6 h-6 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-3">Privacy & Security</h3>
                    <p className="text-neutral-600 leading-relaxed">Your conversations and data are encrypted and completely confidential.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="card p-10 shadow-large"
            >
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-primary-50 rounded-2xl p-4 flex-grow">
                    <p className="text-primary-800 font-medium">I'm feeling anxious about my presentation tomorrow...</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-neutral-300 rounded-2xl flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-neutral-600" />
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex-grow shadow-soft">
                    <p className="text-neutral-700 leading-relaxed">I understand that presentations trigger your anxiety. Based on your recent sessions, the 4-7-8 breathing technique has been helpful. Would you like to practice it together?</p>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <span className="text-sm text-neutral-500 bg-neutral-100 px-4 py-2 rounded-full">
                    Personalized support based on your therapy history
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="py-24 px-6 bg-neutral-50" data-waitlist-section>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-neutral-800 mb-6">Be Among the First</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Zentia is launching soon! Join our exclusive waitlist for early access, special launch pricing, and beta features.
            </p>
          </motion.div>
          <WaitlistCTA />
        </div>
      </section>

      {/* CTA Section */}
      <CTA />

      {/* Floating Action Buttons - Only show to admins */}
      {isAdmin && (
        <div className="fixed bottom-8 right-8 z-40 space-y-3">
          {/* Admin Button */}
          <motion.a
            href="/waitlist-admin"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 150 }}
            className="block w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            title="Waitlist Admin"
          >
            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </motion.a>

          {/* Notification Button */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 150 }}
            onClick={() => setShowNotifications(true)}
            className="w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group"
            title="View Notifications"
          >
            <Bell className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">3</span>
            </div>
          </motion.button>
        </div>
      )}

      {/* Notification History Modal - Only for admins */}
      <AnimatePresence>
        {showNotifications && isAdmin && (
          <NotificationHistory
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Home;