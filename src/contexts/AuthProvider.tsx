import { useCallback, useEffect, useMemo, useState } from 'react';
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

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthContextType['user']>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loginWithGoogle = useCallback(async (): Promise<void> => {
        setError(null);

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Error al iniciar sesión:', error);

            if (error instanceof Error && 'code' in error) {
                const firebaseError = error as Error & { code: string };

                switch (firebaseError.code) {
                    case 'auth/popup-closed-by-user':
                        setError('Cerraste la ventana de inicio de sesión.');
                        break;
                    case 'auth/popup-blocked':
                        setError('El navegador bloqueó la ventana emergente.');
                        break;
                    case 'auth/unauthorized-domain':
                        setError('Este dominio no está autorizado para iniciar sesión.');
                        break;
                    case 'auth/cancelled-popup-request':
                        setError('Ya hay una solicitud de inicio de sesión en curso.');
                        break;
                    default:
                        setError('No se pudo iniciar sesión. Intentá nuevamente.');
                }
            } else {
                setError('Ocurrió un error inesperado al iniciar sesión.');
            }
        }
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        setError(null);

        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            setError('No se pudo cerrar la sesión. Intentá nuevamente.');
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            },
            (error) => {
                console.error('Error al verificar la sesión:', error);
                setError('No se pudo verificar tu sesión.');
                setLoading(false);
            },
        );

        return unsubscribe;
    }, []);

    const contextValue = useMemo(
        () => ({
            user,
            loading,
            error,
            loginWithGoogle,
            logout,
        }),
        [user, loading, error, loginWithGoogle, logout],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}