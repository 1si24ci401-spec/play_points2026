import { useNavigate, useLocation } from 'react-router';
import { SidebarNavigation, SidebarButton, Avatar } from '@figma/astraui';
import { Home, ShoppingBag, ShoppingCart, Package, Settings, LogOut, User, Gift } from 'lucide-react';
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
    { path: '/cart', label: 'Cart', icon: ShoppingCart, hasBadge: true },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/offers', label: 'Offers', icon: Gift },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex h-screen flex-shrink-0">
        <SidebarNavigation
          footer={
            <>
              <SidebarButton
                icon={<Gift size={20} />}
                active={location.pathname === '/offers'}
                onClick={() => navigate('/offers')}
              />
              <SidebarButton
                icon={<User size={20} />}
                active={location.pathname === '/profile'}
                onClick={() => navigate('/profile')}
              />
              {user?.role === 'admin' && (
                <SidebarButton
                  icon={<Settings size={20} />}
                  active={location.pathname === '/admin'}
                  onClick={() => navigate('/admin')}
                />
              )}
              <SidebarButton
                icon={<LogOut size={20} />}
                onClick={handleSignOut}
              />
              <Avatar
                size="medium"
                name={user?.fullName || user?.email || 'User'}
              />
            </>
          }
        >
          <SidebarButton
            icon={<Home size={20} />}
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
          />
          <SidebarButton
            icon={<ShoppingBag size={20} />}
            active={location.pathname === '/products'}
            onClick={() => navigate('/products')}
          />
          <SidebarButton
            icon={
              <div className="relative">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-brand-primary text-on-brand text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    {itemCount > 9 ? '9+' : itemCount}
                  </div>
                )}
              </div>
            }
            active={location.pathname === '/cart'}
            onClick={() => navigate('/cart')}
          />
          <SidebarButton
            icon={<Package size={20} />}
            active={location.pathname === '/orders'}
            onClick={() => navigate('/orders')}
          />
        </SidebarNavigation>
      </div>

      {/* Mobile Floating Bottom Navigation */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="backdrop-blur-xl bg-slate-950/75 border border-slate-900 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] px-2.5 py-1.5 flex items-center justify-around relative overflow-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center flex-1 py-1.5 relative z-10 cursor-pointer select-none"
              >
                {/* Active Indicator Bubble */}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-bubble"
                    className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icon with Optional Badge */}
                <div className="relative flex items-center justify-center">
                  <Icon
                    size={20}
                    className={`transition-colors duration-200 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  {item.hasBadge && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-1 font-medium tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-indigo-400 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}
