import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

import { theme } from '../theme';
import '../utils/dayjsSetup';

// Renderiza con los mismos providers que la app. `env="test"` desactiva
// transiciones y portales para que los tests sean síncronos y estables.
export function renderWithProviders(ui: ReactElement) {
    return render(ui, {
        wrapper: ({ children }) => (
            <MantineProvider theme={theme} env="test">
                <DatesProvider settings={{ locale: 'es', firstDayOfWeek: 1 }}>
                    <ModalsProvider>
                        <Notifications />
                        {children}
                    </ModalsProvider>
                </DatesProvider>
            </MantineProvider>
        ),
    });
}
