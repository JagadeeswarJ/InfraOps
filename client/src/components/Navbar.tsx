import { Link, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <nav className={`border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors duration-300 group">
            <span className="group-hover:animate-pulse">BitNap</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-all duration-300 hover:scale-105 ${
                location.pathname === '/' 
                  ? 'text-foreground border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                {/* Show appropriate dashboard link based on user role */}
                {user?.role === 'manager' && (
                  <Link 
                    to="/dashboard" 
                    className={`text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      location.pathname === '/dashboard' 
                        ? 'text-foreground border-b-2 border-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
                
                {user?.role === 'resident' && (
                  <Link 
                    to="/user-dashboard" 
                    className={`text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      location.pathname === '/user-dashboard' 
                        ? 'text-foreground border-b-2 border-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    My Dashboard
                  </Link>
                )}
                
                {user?.role === 'technician' && (
                  <Link 
                    to="/technician-dashboard" 
                    className={`text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      location.pathname === '/technician-dashboard' 
                        ? 'text-foreground border-b-2 border-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Work Dashboard
                  </Link>
                )}
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user?.name}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={logout}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className={`text-sm font-medium transition-all duration-300 hover:scale-105 ${
                  location.pathname === '/login' 
                    ? 'text-foreground border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
