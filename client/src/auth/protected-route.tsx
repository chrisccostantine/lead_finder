import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from './auth-context';

export function ProtectedRoute() {
  const { user, isLoading, needsSetup } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-canvas"><LoaderCircle className="h-7 w-7 animate-spin text-violet-400" /></div>;
  }
  if (needsSetup) return <Navigate to="/setup" replace />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

