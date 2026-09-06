import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, UserRole } from '@/types';
import { loginApi, meApi } from '@/lib/api/auth';
import { TOKEN_STORAGE_KEY } from '@/lib/api/http';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isHeadUnit: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'asset_hub_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session on mount (token -> /me)
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
          setIsLoading(false);
          return;
        }
        const me = await meApi();
        // Map server profile to frontend User shape (fill minimal fields)
        const mapped: User = {
          id: typeof me.id === 'string' ? me.id : String(me.id),
          email: me.email,
          name: me.email.split('@')[0],
          role: me.role as UserRole,
          department: '-',
          avatar: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(mapped);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mapped));
      } catch (e) {
        // invalid/expired token
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      await loginApi(email, password);
      // After storing token, fetch profile via /me
      const me = await meApi();
      const mapped: User = {
        id: typeof me.id === 'string' ? me.id : String(me.id),
        email: me.email,
        name: me.email.split('@')[0],
        role: me.role as UserRole,
        department: '-',
        avatar: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mapped);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mapped));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Login gagal, silakan cek email atau password Anda' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'admin_asset';
  // Treat basic 'user' as staff-like for menu visibility
  const isStaff = user?.role === 'staff' || user?.role === 'purchasing' || user?.role === 'user';
  const isHeadUnit = user?.role === 'head_unit';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        isAdmin,
        isHeadUnit,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protected routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Anda tidak memiliki akses ke halaman ini
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
