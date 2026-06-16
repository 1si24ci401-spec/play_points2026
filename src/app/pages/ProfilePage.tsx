import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppNav, getUserNavPermissions, getFirstPermittedPage } from '../components/AppNav';
import { useAuth } from '../context/AuthContext';
import { Package, ShoppingCart, Gift, Settings, LogOut, ChevronRight, User, Mail, Star } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  const [perms, setPerms] = useState<Record<string, boolean> | null>(() => 
    user ? getUserNavPermissions(user.id) : null
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
    return () => window.removeEventListener('nav-permissions-updated', handleUpdate);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (perms && perms.profile === false) {
        const target = getFirstPermittedPage(user.id, user.tier);
        if (target !== '/profile') {
          navigate(target);
        }
      }
    }
  }, [user, authLoading, navigate, perms]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (authLoading || !user || (perms && perms.profile === false && getFirstPermittedPage(user.id, user.tier) !== '/profile')) {
    return null;
  }

  const menuItems = [
    {
      label: 'My Orders',
      description: 'Track, edit, or cancel your orders',
      icon: Package,
      path: '/orders'
    },
    {
      label: 'My Cart',
      description: 'View items ready for checkout',
      icon: ShoppingCart,
      path: '/cart'
    },
    {
      label: 'Exclusive Offers',
      description: 'Check active point discount codes',
      icon: Gift,
      path: '/offers'
    },
  ];

  return (
    <div className="size-full flex bg-brand-tertiary" style={{ backgroundColor: 'var(--color-background)' }}>
      <AppNav />

      <main className="flex-1 overflow-auto px-6 pt-8 md:pt-28 pb-24 md:pb-12">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* Swiggy Account Header */}
          <div 
            className={`rounded-2xl border p-6 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden transition-all duration-500 ${
              user.tier === 'premium' ? 'premium-quilt premium-glow' : ''
            }`}
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            {user.tier === 'premium' && (
              <div className="absolute inset-0 premium-shimmer pointer-events-none opacity-40" />
            )}
            
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl shadow-inner flex-shrink-0 transition-all duration-300 ${
              user.tier === 'premium'
                ? 'bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-card)] text-[var(--color-primary-foreground)] border-2 border-[var(--color-primary)] shadow-[0_0_15px_rgba(var(--primary),0.2)]'
                : 'bg-gradient-to-tr from-indigo-500 to-pink-500 text-white'
            }`}>
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 text-center sm:text-left z-10">
              <h1 className={`text-2xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-2 ${
                user.tier === 'premium' ? 'premium-title' : 'text-text-primary'
              }`}>
                <span>{user.fullName || 'Google Play Points User'}</span>
                {user.tier === 'premium' && <span className="text-xl premium-float inline-block">👑</span>}
              </h1>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-text-secondary">
                  <Mail size={14} style={{ color: user.tier === 'premium' ? 'var(--color-primary)' : '' }} />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-text-secondary">
                  <User size={14} style={{ color: user.tier === 'premium' ? 'var(--color-primary)' : '' }} />
                  <span>@{user.username || 'user'}</span>
                </div>
              </div>
              
              {user.tier === 'premium' ? (
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 px-3.5 py-1.5 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl text-[var(--color-primary)] text-sm font-bold w-fit shadow-md premium-float">
                  <Star size={15} className="fill-current text-[var(--color-primary)] animate-pulse" />
                  <span>{user.points || 0} Premium VIP Points</span>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-sm font-semibold w-fit">
                  <Star size={14} className="fill-current text-indigo-400" />
                  <span>{user.points || 0} Points Available</span>
                </div>
              )}
            </div>

            <span 
              className={`absolute top-4 right-4 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border z-10 transition-all duration-300 ${
                user.tier === 'premium'
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/30 shadow-sm'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}
            >
              {user.tier === 'premium' ? 'VIP Premium' : (user.role || 'User')}
            </span>
          </div>

          {/* Account Options Card */}
          <div 
            className="rounded-2xl border overflow-hidden flex flex-col"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center justify-between p-5 cursor-pointer hover:bg-slate-900/15 transition-all duration-200 ${
                    index !== menuItems.length - 1 ? 'border-b' : ''
                  }`}
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[15px]" style={{ color: 'var(--color-card-foreground)' }}>
                        {item.label}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-500" />
                </div>
              );
            })}

            {/* Admin Controls Option (Swiggy Style card item) */}
            {user.role === 'admin' && (
              <div
                onClick={() => navigate('/admin')}
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-900/15 border-t transition-all duration-200"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px]" style={{ color: 'var(--color-card-foreground)' }}>
                      Admin Controls
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                      Manage inventory, orders, offers, and users
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-500" />
              </div>
            )}
          </div>

          {/* Prominent Swiggy-Style Logout Button Card */}
          <div 
            className="rounded-2xl border p-5 flex flex-col"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}
          >
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl border border-red-500/20 hover:border-red-500/30 bg-red-500/10 hover:bg-red-500/15 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <LogOut size={16} />
              <span>Log Out of Account</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
