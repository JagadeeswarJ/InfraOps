import { ReactNode, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string | string[]
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      // Check if user has required role
      if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        const hasRequiredRole = allowedRoles.includes(user.role)
        
        if (!hasRequiredRole) {
          // Redirect based on user's actual role
          const redirectPath = fallbackPath || getDefaultDashboard(user.role)
          window.location.href = redirectPath
          return
        }
      }
    }
  }, [user, loading, requiredRole, fallbackPath])

  // Helper to get default dashboard based on role
  const getDefaultDashboard = (role: string) => {
    switch (role) {
      case 'manager':
        return '/dashboard'
      case 'resident':
        return '/user-dashboard'
      case 'technician':
        return '/technician-dashboard'
      default:
        return '/login'
    }
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = '/login'
    return null
  }

  // If role check is needed and user doesn't have required role, show nothing
  // (redirect will happen in useEffect)
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const hasRequiredRole = allowedRoles.includes(user.role)
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}