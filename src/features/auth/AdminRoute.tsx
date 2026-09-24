import type { ReactNode } from 'react'; import { Navigate, useLocation } from 'react-router-dom'; import { hasAdminSession } from './adminSession';
export function AdminRoute({ children }: { children: ReactNode }) { const location = useLocation(); return hasAdminSession() ? <>{children}</> : <Navigate replace state={{ from: location.pathname }} to="/admin"/>; }
