import { Link, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"

export function Navbar() {
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)

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
          </div>
        </div>
      </div>
    </nav>
  )
}
