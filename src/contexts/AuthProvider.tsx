import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
} from 'firebase/auth';

import { auth } from '../services/firebase';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './AuthContext';

interface AuthProviderProps {
    readonly children: ReactNode;
}

async function loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();

    await signInWithPopup(auth, provider);
}

async function logout(): Promise<void> {
    await signOut(auth);
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
            loginWithGoogle,
            logout,
        }),
        [user, loading],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}