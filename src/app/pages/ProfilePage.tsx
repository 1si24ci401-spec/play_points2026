import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@figma/astraui';
import { AppNav } from '../components/AppNav';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="size-full flex bg-brand-tertiary">
      <AppNav />

      <main className="flex-1 overflow-auto p-2xl">
        <div className="flex flex-col gap-xl max-w-3xl">
          <div className="flex flex-col gap-xs">
            <h1 className="text-text-primary">Profile Settings</h1>
            <p className="text-text-secondary">Manage your account information</p>
          </div>

          <div className="bg-surface-bg rounded-corner-lg p-xl flex flex-col gap-lg">
            <h2 className="text-text-primary">Account Information</h2>

            <div className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <span className="text-sm text-text-secondary">Full Name</span>
                <span className="text-text-primary">{user.fullName || 'Not provided'}</span>
              </div>

              <div className="flex flex-col gap-xs">
                <span className="text-sm text-text-secondary">Username</span>
                <span className="text-text-primary">{user.username || 'Not provided'}</span>
              </div>

              <div className="flex flex-col gap-xs">
                <span className="text-sm text-text-secondary">Email</span>
                <span className="text-text-primary">{user.email}</span>
              </div>

              <div className="flex flex-col gap-xs">
                <span className="text-sm text-text-secondary">Account Type</span>
                <span className="text-text-primary capitalize">{user.role || 'User'}</span>
              </div>

              {user.role === 'admin' && (
                <div className="flex flex-col gap-sm pt-4 border-t border-slate-800">
                  <span className="text-sm text-text-secondary font-medium">Administrative Controls</span>
                  <Button variant="primary" onClick={() => navigate('/admin')} className="w-full sm:w-auto">
                    Go to Admin Dashboard
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
