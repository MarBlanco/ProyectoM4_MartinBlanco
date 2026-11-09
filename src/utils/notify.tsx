import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';

// Notificaciones de la aplicación (toasts). Centralizadas para mantener
// textos, colores y accesibilidad consistentes en todas las pantallas.
export function notifySuccess(message: string, title = 'Listo') {
    notifications.show({
        title,
        message,
        color: 'teal',
        icon: <IconCheck size={18} />,
        closeButtonProps: { 'aria-label': 'Cerrar notificación' },
    });
}

export function notifyError(message: string, title = 'Ocurrió un problema') {
    notifications.show({
        title,
        message,
        color: 'red',
        icon: <IconAlertTriangle size={18} />,
        autoClose: 8000,
        closeButtonProps: { 'aria-label': 'Cerrar notificación' },
    });
}
