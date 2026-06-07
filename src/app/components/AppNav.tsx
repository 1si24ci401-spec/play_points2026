import { useNavigate, useLocation } from 'react-router';
import { Home, ShoppingBag, ShoppingCart, Package, Settings, LogOut, User, Gift, ChevronDown, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';

export function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/products', label: 'Shop', icon: ShoppingBag },
    { path: '/offers', label: 'Offers', icon: Gift },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/cart', label: 'Cart', icon: ShoppingCart, hasBadge: true },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Swiggy-Style Top Navigation Header */}
      <header 
        className="hidden md:block fixed top-0 left-0 right-0 h-20 z-50 border-b transition-colors duration-200"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 15px 40px -20px rgba(0,0,0,0.15)'
        }}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          {/* Left Side: Brand Logo & Swiggy Location Selector */}
          <div className="flex items-center">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => navigate('/')}
            >
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-pink-500 shadow-md"
              >
                <Star size={20} className="text-white fill-current" />
              </motion.div>
              <span className="font-bold text-lg tracking-tight text-foreground transition-colors group-hover:text-indigo-400">
                Play Points
              </span>
            </div>

            {/* Swiggy Address Indicator */}
            <div className="flex items-center gap-1.5 text-[13px] border-l pl-4 ml-6 cursor-pointer hover:text-indigo-400 transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span className="font-bold" style={{ color: 'var(--color-foreground)' }}>Other</span>
              <span className="truncate max-w-[200px]" style={{ color: 'var(--color-muted-foreground)' }}>
                Discord Profile Address
              </span>
              <ChevronDown size={14} className="text-indigo-400" />
            </div>
          </div>

          {/* Right Side: Swiggy Desktop Spaced Links */}
          <nav className="flex items-center gap-10">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 cursor-pointer py-2 font-medium text-[15px] select-none group transition-colors duration-200 ${
                    isActive ? 'text-indigo-400' : 'text-slate-300 hover:text-indigo-400'
                  }`}
                  style={{ color: isActive ? 'var(--color-primary)' : '' }}
                >
                  <div className="relative">
                    <Icon size={19} className="transition-transform group-hover:-translate-y-0.5 duration-200" />
                    {item.hasBadge && itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-sm">
                        {itemCount}
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </div>
              );
            })}

            {/* Desktop Quick Logout */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 cursor-pointer py-2 font-medium text-[15px] select-none text-slate-300 hover:text-red-400 transition-colors duration-200 group"
            >
              <LogOut size={19} className="transition-transform group-hover:translate-x-0.5 duration-200" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Swiggy-Style Bottom Navigation Bar */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-50 border-t flex items-center justify-around pb-[env(safe-area-inset-bottom,0px)]"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.1)'
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center justify-center flex-1 py-2 relative z-10 cursor-pointer select-none"
            >
              {/* Active Slide highlight */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-glow"
                  className="absolute bottom-1 w-10 h-1 rounded-full bg-indigo-500"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}

              {/* Icon with Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  size={19}
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                />
                {item.hasBadge && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
