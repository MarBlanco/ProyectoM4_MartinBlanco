import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import TaskEditForm from './TaskEditForm';
import TaskForm from './TaskForm';
import { renderWithProviders } from '../test/render';
import { makeTask } from '../test/utils';

// Escribir fechas con userEvent es lento; evita fallos por carga de la máquina.
vi.setConfig({ testTimeout: 15000 });

describe('fecha de vencimiento en TaskForm', () => {
    it('crea una tarea con fecha', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);

        renderWithProviders(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText(/^Título/), 'Tarea');
        await user.type(screen.getByLabelText(/^Descripción/), 'Detalle');
        await user.type(screen.getByLabelText('Fecha de vencimiento'), '20/11/2026');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(onSubmit).toHaveBeenCalledWith('Tarea', 'Detalle', '2026-11-20');
    });

    it('crea una tarea sin fecha con la llamada original', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);

        renderWithProviders(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText(/^Título/), 'Tarea');
        await user.type(screen.getByLabelText(/^Descripción/), 'Detalle');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(onSubmit).toHaveBeenCalledWith('Tarea', 'Detalle');
    });
});

describe('fecha de vencimiento en TaskEditForm', () => {
    function setup(task = makeTask({ dueDate: '2026-11-20' })) {
        const onSubmit = vi.fn().mockResolvedValue(true);
        renderWithProviders(
            <TaskEditForm task={task} onSubmit={onSubmit} onCancel={vi.fn()} loading={false} />,
        );
        return { onSubmit, task };
    }

    it('muestra la fecha actual', () => {
        setup();
        expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue('20/11/2026');
    });

    it('edita la fecha', async () => {
        const user = userEvent.setup();
        const { onSubmit, task } = setup();

        const input = screen.getByLabelText('Fecha de vencimiento');
        await user.clear(input);
        await user.type(input, '05/12/2026');
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(onSubmit).toHaveBeenCalledWith(task.id, task.title, task.description, '2026-12-05');
    });

    it('quita la fecha', async () => {
        const user = userEvent.setup();
        const { onSubmit, task } = setup();

        await user.clear(screen.getByLabelText('Fecha de vencimiento'));
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(onSubmit).toHaveBeenCalledWith(task.id, task.title, task.description, null);
    });

    it('una tarea antigua sin dueDate se edita sin tocar la fecha', async () => {
        const user = userEvent.setup();
        const { onSubmit, task } = setup(makeTask());

        expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue('');
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(onSubmit).toHaveBeenCalledWith(task.id, task.title, task.description);
    });
});
