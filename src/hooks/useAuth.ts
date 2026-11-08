import { useContext } from 'react';

import { AuthContext } from '../contexts/AuthContext';
import type { AuthContextType } from '../contexts/AuthContext';

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === null) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }

    return context;
}
