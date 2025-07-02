import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import MobileMenu from '../components/common/MobileMenu';
import { 
  // Common icons
  Heart, ArrowLeft, LogOut, Settings, Bell, Search, Menu, X,
  // Client icons
  MessageSquare, LineChart, BookOpen, Brain, Target, Sparkles,
  // Therapist icons
  Users, FileText, BarChart2, Activity, Cloud, Download, Plus,
  // Enhanced therapist icons
  Shield, Video, BookOpen as Training, TrendingUp as Analytics,
  // Status icons
  CheckCircle, AlertCircle, Clock, ChevronRight
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

interface UnifiedLayoutProps {
  children?: React.ReactNode;
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect logic
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Simulate loading state for smooth transitions
    setTimeout(() => setIsLoading(false), 300);
  }, [location.pathname]);

  // Get navigation items based on user role
  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    if (user.role === 'patient' || user.role === 'client') {
      return [
        { icon: MessageSquare, label: '🤖 AI Companion', href: '/client/chat', badge: 2 },
        { icon: BookOpen, label: '📝 Smart Journal', href: '/client/journal' },
        { icon: Target, label: '🎯 My Progress', href: '/client' },
        { icon: Sparkles, label: '✨ Insights', href: '/client/insights' }
      ];
    }

    if (user.role === 'therapist') {
      return [
        { icon: Users, label: '👥 My Clients', href: '/therapist/clients', badge: 3 },
        { icon: Brain, label: '🧠 AI Assistant', href: '/therapist/ai-toolbox' },
        { icon: Analytics, label: '📊 Smart Analytics', href: '/therapist/analytics-hub' },
        { icon: MessageSquare, label: '💬 Secure Chat', href: '/therapist/communication-hub' }
      ];
    }

    return [];
  };

  const navItems = getNavItems();
  const isActive = (href: string) => {
    if (href === '/client' || href === '/therapist') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="loader mx-auto mb-4"></div>
          <p className="text-gray-600 animate-pulse">Loading...</p>
        </motion.div>
      </div>
    );
  }

  const roleConfig = {
    client: {
      title: 'Zentia AI',
      subtitle: '🤖 Your smart mental wellness companion',
      gradient: 'from-emerald-500 to-teal-600'
    },
    therapist: {
      title: 'Zentia Pro',
      subtitle: '🧠 AI-powered clinical excellence',
      gradient: 'from-purple-500 to-blue-600'
    }
  };

  const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.client;

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navItems}
        title={config.title}
        subtitle={config.subtitle}
        user={user}
        onLogout={handleLogout}
      />

      {/* Desktop Sidebar (new design) */}
      {user && (
        <Sidebar>
          <SidebarBody className="flex flex-col h-full">
            {/* Top: Logo and Main Nav */}
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              <Link to="/" className="flex items-center group mb-6">
                <div className={`w-10 h-10 bg-gradient-to-r ${config.gradient} rounded-2xl flex items-center justify-center shadow-soft`}>
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors hidden md:block">
                  {config.title}
                </span>
              </Link>
              <div className="flex flex-col gap-2">
                {navItems.map((item, idx) => (
                  <SidebarLink key={idx} link={{ label: item.label, href: item.href, icon: <item.icon className="w-5 h-5" /> }} />
                ))}
              </div>
            </div>
            {/* Bottom: Profile, Sign Out, Settings */}
            <SidebarSignOutButton handleLogout={handleLogout} />
            <div className="flex flex-col gap-2 mt-auto mb-2 pt-4 border-t border-neutral-200">
              <SidebarLink link={{ label: user.name, href: '#', icon: <img src={user.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${user.email}`} alt={user.name} className="h-7 w-7 flex-shrink-0 rounded-full" /> }} />
              <SidebarLink link={{ label: 'Settings', href: user.role === 'therapist' ? '/therapist/settings' : '/client/settings', icon: <Settings className="w-5 h-5" /> }} />
            </div>
          </SidebarBody>
        </Sidebar>
      )}

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-200 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button - Larger touch target for mobile */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-3 -ml-1 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors mr-2"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-neutral-600" />
              </motion.button>
              
              {/* Back button - Mobile optimized */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Link 
                  to="/" 
                  className="p-2 md:p-2 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors mr-2 md:mr-3"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-neutral-600" />
                </Link>
              </motion.div>
              
              {/* Page breadcrumb */}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-semibold text-neutral-900 capitalize truncate">
                  {location.pathname.split('/').pop() || 'Dashboard'}
                </h1>
                <p className="text-xs md:text-sm text-neutral-500 hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Header actions - Mobile optimized */}
            <div className="flex items-center space-x-1 md:space-x-2">
              {/* Search (placeholder) - Hidden on small screens */}
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex p-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-neutral-600" />
              </motion.button>
              
              {/* Notifications - Larger touch target */}
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-neutral-600" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-error-500 rounded-full border-2 border-white"></span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow p-4 md:p-6 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

const SidebarSignOutButton = ({ handleLogout }: { handleLogout: () => void }) => {
  const { open } = useSidebar();
  return (
    <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 rounded-md p-2 w-full">
      <LogOut className="w-5 h-5" />
      {open && <span>Sign Out</span>}
    </button>
  );
};

export default UnifiedLayout; 