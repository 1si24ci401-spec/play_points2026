import { useNavigate } from 'react-router';
import { Button } from '@figma/astraui';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="size-full bg-brand-tertiary flex items-center justify-center p-2xl">
      <div className="flex flex-col items-center gap-xl text-center max-w-md">
        <div className="text-[6rem] font-medium text-brand-primary">404</div>
        <div className="flex flex-col gap-xs">
          <h1 className="text-text-primary">Page Not Found</h1>
          <p className="text-text-secondary">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button
          variant="primary"
          iconStart={<Home size={16} />}
          onClick={() => navigate('/')}
        >
          Go Home
        </Button>
      </div>
    </div>
  );
}
