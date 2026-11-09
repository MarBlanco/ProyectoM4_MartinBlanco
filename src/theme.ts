import { createTheme } from '@mantine/core';

// Tema único de la aplicación: paleta índigo, bordes redondeados y títulos con peso consistente.
// primaryShade 7 asegura contraste AA (WCAG) del texto blanco sobre botones primarios.
export const theme = createTheme({
    primaryColor: 'indigo',
    primaryShade: 7,
    defaultRadius: 'md',
    headings: {
        fontWeight: '700',
    },
});
