import { Outlet } from 'react-router';
import { ThemeProvider } from '@figma/astraui';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';

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

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <div className="size-full">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <LoadingScreen key="loading" onComplete={handleLoadingComplete} />
              ) : null}
            </AnimatePresence>
            {!isLoading && <Outlet />}
          </div>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
