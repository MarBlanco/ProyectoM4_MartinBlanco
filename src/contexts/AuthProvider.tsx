// ARCHIVO: src/contexts/AuthProvider.tsx

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../services/firebase';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './AuthContext';

interface AuthProviderProps {
    readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthContextType['user']>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const contextValue = useMemo(
        () => ({
            user,
            loading,
        }),
        [user, loading],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}