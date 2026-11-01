import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { AuthContext } from './AuthContext';

interface AuthProviderProps {
    readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const user = null;
    const loading = true;

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