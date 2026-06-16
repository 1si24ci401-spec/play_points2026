import { useNavigate, useLocation } from 'react-router';
import {
  ShoppingBag, ShoppingCart, Package, LogOut, User, Gift, Star,
  X, Crown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';

// Nav permissions helper — stored per-user in localStorage by admin
export function getUserNavPermissions(userId: string): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(`playpoints_nav_perms_${userId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { shop: true, offers: true, orders: true, vip_lounge: true, cart: true, profile: true };
}

export function getFirstPermittedPage(userId: string, tier?: string): string {
  const perms = getUserNavPermissions(userId);
  if (perms.shop !== false) return '/products';
  if (perms.offers !== false) return '/offers';
  if (perms.orders !== false) return '/orders';
  if (tier === 'premium' && perms.vip_lounge !== false) return '/vip-lounge';
  if (perms.cart !== false) return '/cart';
  return '/profile';
}

export function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [perms, setPerms] = useState<Record<string, boolean>>(() => 
    user ? getUserNavPermissions(user.id) : {
      shop: true, offers: true, orders: true, vip_lounge: true, cart: true, profile: true
    }
  );

  useEffect(() => {
    if (!user) return;
    setPerms(getUserNavPermissions(user.id));

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.userId === user.id) {
        setPerms(customEvent.detail.perms);
      }
    };
    window.addEventListener('nav-permissions-updated', handleUpdate);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `playpoints_nav_perms_${user.id}`) {
        try {
          if (e.newValue) {
            setPerms(JSON.parse(e.newValue));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('nav-permissions-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const allNavItems = [
    { path: '/products', label: 'Shop', icon: ShoppingBag, permKey: 'shop' },
    { path: '/offers', label: 'Offers', icon: Gift, permKey: 'offers' },
    { path: '/orders', label: 'Orders', icon: Package, permKey: 'orders' },
    ...(user?.tier === 'premium' ? [{ path: '/vip-lounge', label: 'VIP Lounge', icon: Crown, permKey: 'vip_lounge' }] : []),
    { path: '/cart', label: 'Cart', icon: ShoppingCart, hasBadge: true, permKey: 'cart' },
    { path: '/profile', label: 'Profile', icon: User, permKey: 'profile' },
  ];

  const navItems = allNavItems.filter(item => perms[item.permKey] !== false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase() || 'U';
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <>
      {/* ── Desktop Header ── */}
      <header
        className="hidden md:block fixed top-0 left-0 right-0 h-16 z-50 border-b"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 4px 24px -8px rgba(0,0,0,0.12)'
        }}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate(user ? '/products' : '/')}>
            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-pink-500 shadow-md">
              <Star size={18} className="text-white fill-current" />
            </motion.div>
            <span className="font-bold text-base tracking-tight text-foreground transition-colors group-hover:text-indigo-400">Play Points</span>
          </div>

          <nav className="flex items-center gap-1 lg:gap-2">
            {user && (
              <button onClick={() => navigate('/profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold select-none cursor-pointer transition-all duration-300 mr-3 ${
                  user.tier === 'premium'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/15'
                    : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15'
                }`}>
                <Star size={12} className="fill-current" />
                {user.points || 0} pts
                {user.tier === 'premium' && <span className="ml-0.5">✨</span>}
              </button>
            )}

            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium select-none cursor-pointer transition-all duration-200 ${
                    isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/5'
                  }`}>
                  <Icon size={16} />
                  <span className="hidden lg:inline">{item.label}</span>
                  {item.hasBadge && itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow">
                      {itemCount}
                    </span>
                  )}
                </button>
              );
            })}

            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer ml-1">
              <LogOut size={16} />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── Mobile: iOS Dock + Profile Dropdown ── */}
      <div ref={menuRef} className="md:hidden fixed bottom-0 left-0 right-0 z-[60] flex flex-col items-center pb-3 px-4">

        {/* Dropdown menu — slides up */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="w-full max-w-[480px] rounded-[24px] border overflow-hidden shadow-2xl mb-3"
              style={{
                backgroundColor: 'rgba(18,18,22,0.95)',
                borderColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              {/* Profile mini-card */}
              {user && (
                <div className="p-3 border-b flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
                      <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#141418' }}>
                        <span className="bg-gradient-to-br from-indigo-400 to-pink-400 bg-clip-text text-transparent">{userInitial}</span>
                      </div>
                    </div>
                    {user.tier === 'premium' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-[#141418] flex items-center justify-center">
                        <Crown size={8} className="text-zinc-900" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-white/90">{user.user_metadata?.full_name || userName}</p>
                    <p className="text-[9px] truncate text-white/40 mt-0.5">{user.email}</p>
                  </div>
                  <svg className="flex-shrink-0 text-indigo-400 opacity-50" fill="none" height="20" viewBox="0 0 12 24" width="10">
                    <path d="M2 4C6 8 6 16 2 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
                  </svg>
                </div>
              )}

              {/* Points chip */}
              {user && (
                <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    user.tier === 'premium' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' : 'bg-indigo-500/12 border border-indigo-500/25 text-indigo-400'
                  }`}>
                    <Star size={9} className="fill-current" />{user.points || 0} Points{user.tier === 'premium' && ' ✨'}
                  </div>
                </div>
              )}

              {/* Nav items */}
              <div className="py-1">
                {navItems.map((item, idx) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <motion.button key={item.path}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.022 * idx, type: 'spring', stiffness: 420 }}
                      onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-left cursor-pointer group ${
                        isActive ? 'bg-indigo-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border relative transition-colors ${
                        isActive ? 'bg-indigo-500/15 border-indigo-500/25' : 'border-white/8 bg-white/5 group-hover:border-indigo-500/20'
                      }`}>
                        <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-white/50'} />
                        {item.hasBadge && itemCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">{itemCount}</span>
                        )}
                      </div>
                      <span className="flex-1 text-white/80">{item.label}</span>
                      {item.label === 'VIP Lounge' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold">VIP</span>
                      )}
                      {item.hasBadge && itemCount > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-bold">{itemCount}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mx-3 h-px my-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="p-1.5">
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl cursor-pointer group bg-red-500/8 hover:bg-red-500/15 border border-transparent hover:border-red-500/20 transition-all duration-200">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/12 flex-shrink-0">
                    <LogOut size={13} className="text-red-400" />
                  </div>
                  <span className="text-red-400">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── iOS Dock bar ── */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.1 }}
          className="w-full max-w-[480px] rounded-[32px] overflow-hidden p-1 shadow-2xl"
          style={{
            backgroundColor: 'rgba(20,20,28,0.85)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 10px 45px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08)',
          }}
        >
          {/* Expanded Profile Pill Button Trigger */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-5 py-3 rounded-[28px] cursor-pointer transition-all duration-200 relative select-none"
            style={{
              backgroundColor: mobileMenuOpen ? 'rgba(99,102,241,0.15)' : 'transparent',
            }}
            aria-label="Open menu"
          >
            {/* User name & tier status */}
            <div className="text-left flex flex-col justify-center">
              <p className="text-sm font-bold leading-tight text-white tracking-tight">
                {userName}
              </p>
              <p className="text-[10px] leading-none flex items-center gap-1 font-medium mt-0.5"
                 style={{ color: user?.tier === 'premium' ? '#FBBF24' : '#9CA3AF' }}>
                {user?.tier === 'premium' ? '✨ Premium' : 'Standard'}
              </p>
            </div>

            {/* Right container: Avatar + Icon */}
            <div className="flex items-center gap-3">
              {/* Avatar ring with status badge */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-[1.5px]">
                  <div className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#141418', color: 'white' }}>
                    {userInitial}
                  </div>
                </div>
                {/* Cart badge on avatar */}
                {!mobileMenuOpen && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow-lg">
                    {itemCount}
                  </span>
                )}
                {/* VIP Badge */}
                {user?.tier === 'premium' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border border-[#141418] flex items-center justify-center">
                    <Crown size={7} className="text-zinc-900 fill-current" />
                  </div>
                )}
              </div>

              {/* Chevron indicator */}
              <ChevronUp className={`w-5 h-5 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-180 text-indigo-400' : 'text-white/40'}`} />
            </div>
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-[4px]"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// iOS Dock individual icon — magnifying glass scale effect
function DockItem({ icon, label, isActive, isVip = false, onClick }: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isVip?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.82 }}
      whileHover={{ scale: 1.22, y: -6 }}
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-1 cursor-pointer relative"
      style={{ flex: '1 1 0' }}
    >
      <div
        className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all duration-200 ${
          isActive
            ? isVip
              ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
              : 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30'
            : isVip
              ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20'
              : 'bg-white/8 border border-white/10 hover:bg-white/12'
        }`}
      >
        <span className={isActive ? 'text-white' : isVip ? 'text-amber-400' : 'text-white/60'}>
          {icon}
        </span>
      </div>
      <span className={`text-[9px] font-medium leading-none ${isActive ? (isVip ? 'text-amber-400' : 'text-indigo-400') : 'text-white/40'}`}>
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="dock-indicator"
          className={`absolute -bottom-1 w-1 h-1 rounded-full ${isVip ? 'bg-amber-400' : 'bg-indigo-400'}`}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}
