import { createContext } from 'react';
import type { User } from 'firebase/auth';

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

// null = fuera de un AuthProvider. useAuth() lo detecta y lanza un error claro.
export const AuthContext = createContext<AuthContextType | null>(null);
