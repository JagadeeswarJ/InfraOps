import {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import { TOKEN_STORE } from "../utils/api";
import { useNavigate, useLocation } from "react-router-dom";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'resident' | 'technician' | 'manager';
  communityId?: string;
  expertise?: string[];
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  loading: boolean;
  checkAuth: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = () => {
    setLoading(true);
    const storedToken = localStorage.getItem(TOKEN_STORE);
    
    if (storedToken) {
      try {
        // Parse JWT token to get user info
        const tokenPayload = JSON.parse(atob(storedToken.split(".")[1]));
        
        // Check if token is expired
        if (tokenPayload.exp < Date.now() / 1000) {
          console.log("Session expired, please login again");
          logout();
        } else {
          setToken(storedToken);
          
          // Set user data from token payload
          const userData: User = {
            id: tokenPayload.userId,
            name: tokenPayload.name || "",
            email: tokenPayload.email,
            role: tokenPayload.role,
            communityId: tokenPayload.communityId,
            expertise: tokenPayload.expertise,
          };
          setUser(userData);
          
          // Redirect from login page if authenticated
          if (location.pathname === "/login") {
            navigate("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error parsing token:", error);
        logout();
      }
    } else {
      // No token found, redirect to login if not on public pages
      if (location.pathname !== "/" && location.pathname !== "/login") {
        navigate("/login");
      }
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORE);
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  // Check auth on mount and token changes
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ 
        token, 
        user, 
        setToken, 
        setUser, 
        logout, 
        loading, 
        checkAuth, 
        isAuthenticated 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthContext, AuthProvider };