import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import authService from '../../services/authService';

// Older builds kept the token in localStorage — wipe anything left behind.
try {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
} catch {
  // Storage can be unavailable (private mode); nothing to clean up then.
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Whether we've asked the server (via the refresh cookie) if a session exists yet
  const [sessionStatus, setSessionStatus] = useState('idle'); // 'idle' | 'checking' | 'done'

  // Only ever check once. A ref (not state) is updated synchronously, so StrictMode's
  // double effect can't send two refresh requests at once, where the second would
  // fail on the rotated token.
  const sessionChecked = useRef(false);

  const restoreSession = useCallback(async () => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;
    setSessionStatus('checking');
    try {
      setUser(await authService.restoreSession());
    } catch {
      // No valid refresh cookie: the teacher has to log in
    } finally {
      setSessionStatus('done');
    }
  }, []);

  const signIn = useCallback((signedInUser) => {
    sessionChecked.current = true;
    setUser(signedInUser);
    setSessionStatus('done');
  }, []);

  const login = useCallback(
    async (credentials) => signIn(await authService.login(credentials)),
    [signIn]
  );

  const register = useCallback(
    async (userData) => signIn(await authService.register(userData)),
    [signIn]
  );

  const logout = useCallback(async () => {
    // Log out locally even if the server call fails
    await authService.logout().catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, sessionStatus, restoreSession, login, register, logout }),
    [user, sessionStatus, restoreSession, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
