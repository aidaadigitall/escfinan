import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUserPermissions } from "@/hooks/useUserPermissions";
import { toast } from "sonner";
import { useEffect } from "react";

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  permission: string;
  redirectTo?: string;
}

export const PermissionProtectedRoute = ({ 
  children, 
  permission, 
  redirectTo = "/" 
}: PermissionProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { permissions, isLoading: permissionsLoading } = useCurrentUserPermissions();

  const hasPermission = permissions[permission as keyof typeof permissions] ?? true;

  useEffect(() => {
    if (!authLoading && !permissionsLoading && user && !hasPermission) {
      toast.error("Você não tem permissão para acessar esta página");
    }
  }, [authLoading, permissionsLoading, user, hasPermission]);

  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
