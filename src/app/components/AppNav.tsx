import { useNavigate, useLocation } from 'react-router';
import { SidebarNavigation, SidebarButton, Avatar } from '@figma/astraui';
import { Home, ShoppingBag, ShoppingCart, Package, Settings, LogOut, User, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

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

  return (
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
  );
}
