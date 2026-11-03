// ARCHIVO: src/contexts/AuthContext.ts

import { createContext } from 'react';
import type { User } from 'firebase/auth';

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    loginWithGoogle: async () => { },
});