import { Outlet } from 'react-router';
import { ThemeProvider } from '@figma/astraui';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { OffersNotification } from '../components/OffersNotification';
import { UserNotificationPopup } from '../components/UserNotificationPopup';
import { isSupabaseConfigured } from '../../utils/supabase/client';
import { SetupWarningScreen } from '../components/SetupWarningScreen';
import { OrderChatbot } from '../components/OrderChatbot';

import { useAuth } from '../context/AuthContext';
import { PremiumAmbientGlow } from '../components/PremiumAmbientGlow';

export function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasSeenLoading = sessionStorage.getItem('hasSeenLoading');
    if (hasSeenLoading) {
      setIsLoading(false);
    }
  }, []);

  const handleLoadingComplete = () => {
    sessionStorage.setItem('hasSeenLoading', 'true');
    setIsLoading(false);
  };

  if (!isSupabaseConfigured()) {
    return (
      <ThemeProvider>
        <SetupWarningScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen w-full relative overflow-x-hidden bg-[#04040a] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Ambient glassmorphic glowing blobs in background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
              {/* Blob 1 - Top Left Pink/Magenta */}
              <div 
                className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-pink-500/10 blur-[130px] animate-pulse" 
                style={{ animationDuration: '9s' }} 
              />
              {/* Blob 2 - Bottom Right Cyan/Indigo */}
              <div 
                className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-[700px] rounded-full bg-indigo-500/12 blur-[140px] animate-pulse" 
                style={{ animationDuration: '14s' }} 
              />
              {/* Blob 3 - Middle Purple/Blue */}
              <div 
                className="absolute top-[35%] left-[40%] w-[40vw] h-[40vw] max-w-[500px] rounded-full bg-violet-600/8 blur-[120px] animate-pulse" 
                style={{ animationDuration: '11s' }} 
              />
              
              {/* Subtle dotted pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
            </div>

            <div className="relative z-10 size-full min-h-screen flex flex-col">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <LoadingScreen key="loading" onComplete={handleLoadingComplete} />
                ) : null}
              </AnimatePresence>
              {!isLoading && <Outlet />}
              {!isLoading && <OffersNotification />}
              {!isLoading && <UserNotificationPopup />}
              {!isLoading && <OrderChatbot />}
              {!isLoading && <PremiumThemeWrapper />}
            </div>
          </div>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function PremiumThemeWrapper() {
  const { user } = useAuth();
  if (user?.tier !== 'premium') return null;
  return <PremiumAmbientGlow />;
}
