import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Zentia' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      navigate('/');
    }
  };

  const navItems = [
    { name: 'About Us', url: '/about' },
    { name: 'Login', url: '/login' },
    { name: 'Sign Up', url: '/register' },
  ];

  return (
    <nav className="fixed top-0 left-1/2 -translate-x-1/2 z-50 pt-2">
      <div className="flex items-center gap-2 bg-background/80 border border-border backdrop-blur-lg py-0 px-1 rounded-full shadow-lg">
        <Link to="/" className="flex items-center group min-h-[36px] px-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
            className="w-8 h-8 sm:w-9 sm:h-9 gradient-primary rounded-2xl flex items-center justify-center shadow-soft"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/>
              </svg>
            </motion.div>
          <h1 className="text-base sm:text-lg font-bold text-neutral-800 ml-2 sm:ml-2 group-hover:text-primary-600 transition-colors">Zentia</h1>
          </Link>
        {/* Navigation Items */}
        {user ? (
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-2 rounded-2xl hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px]"
              aria-label={isMenuOpen ? "Close user menu" : "Open user menu"}
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-primary-200">
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${user.email}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden md:block text-xs sm:text-sm font-medium text-neutral-700">{user.name}</span>
              <Menu className="w-5 h-5 text-neutral-500" />
            </motion.button>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-large py-2 z-10 border border-neutral-200"
              >
                <Link
                  to={user.role === 'admin' ? '/waitlist-admin' : user.role === 'therapist' ? '/therapist' : '/client'}
                  className="block px-4 py-3 text-xs sm:text-sm text-neutral-700 hover:bg-neutral-50 flex items-center rounded-xl mx-2 transition-colors min-h-[44px]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-3" />
                  {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </Link>
                <Link
                  to={user.role === 'admin' ? '/settings' : user.role === 'therapist' ? '/therapist/settings' : '/client/settings'}
                  className="block px-4 py-3 text-xs sm:text-sm text-neutral-700 hover:bg-neutral-50 flex items-center rounded-xl mx-2 transition-colors min-h-[44px]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Link>
                <div className="border-t border-neutral-200 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 text-xs sm:text-sm text-neutral-700 hover:bg-neutral-50 flex items-center rounded-xl mx-2 transition-colors min-h-[44px]"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          navItems.map((item, idx) => (
            <Link
              key={item.name}
              to={item.url}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-4 py-1 rounded-full transition-colors",
                "text-foreground/80 hover:text-primary",
                window.location.pathname === item.url && "bg-muted text-primary"
              )}
            >
              <span>{item.name}</span>
              {window.location.pathname === item.url && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
          </div>
                </motion.div>
              )}
            </Link>
          ))
        )}
      </div>
    </nav>
  );
};

export default Header;