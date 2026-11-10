import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import { renderWithProviders } from './test/render';
import { makeTask } from './test/utils';

const XSS_TITLE = '<img src=x onerror="window.__xss=1">Hola';
const XSS_DESCRIPTION = '<script>window.__xss=1</script><b>negrita</b>';

describe('XSS: el contenido de las tareas se muestra como texto', () => {
    it('no interpreta HTML en título ni descripción', () => {
        const { container } = renderWithProviders(
            <TaskCard
                task={makeTask({ title: XSS_TITLE, description: XSS_DESCRIPTION })}
                busy={false}
                disabled={false}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onToggleCompleted={vi.fn()}
            />,
        );

        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('script')).toBeNull();
        expect(container.querySelector('b')).toBeNull();
        expect(screen.getByText(XSS_TITLE)).toBeInTheDocument();
        expect(screen.getByText(XSS_DESCRIPTION)).toBeInTheDocument();
        expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
    });
});

describe('inyección: los textos se envían como datos, sin filtrar palabras', () => {
    it('acepta palabras SQL y caracteres especiales sin modificarlos', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);
        const title = "SELECT * FROM tasks; DELETE FROM users -- ' OR '1'='1";
        const description = '{"$ne": null} <b>x</b> DROP TABLE tareas;';

        renderWithProviders(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.click(screen.getByLabelText(/^Título/));
        await user.paste(title);
        await user.click(screen.getByLabelText(/^Descripción/));
        await user.paste(description);
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(onSubmit).toHaveBeenCalledWith(title, description);
    });
});
