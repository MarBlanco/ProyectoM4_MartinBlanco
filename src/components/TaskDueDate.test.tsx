import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TaskEditForm from './TaskEditForm';
import TaskForm from './TaskForm';
import { renderWithProviders } from '../test/render';
import { makeTask } from '../test/utils';

// Escribir fechas con userEvent es lento; evita fallos por carga de la máquina.
vi.setConfig({ testTimeout: 15000 });

// "Hoy" fijo: 9/11/2026.
beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 9, 12) });
});

afterEach(() => {
    vi.useRealTimers();
});

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

describe('fechas pasadas', () => {
    it('al crear, ignora una fecha anterior a hoy escrita a mano', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);

        renderWithProviders(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText(/^Título/), 'Tarea');
        await user.type(screen.getByLabelText(/^Descripción/), 'Detalle');
        await user.type(screen.getByLabelText('Fecha de vencimiento'), '08/11/2026');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        // La fecha pasada nunca entra al formulario: la tarea se crea sin fecha.
        expect(onSubmit).toHaveBeenCalledWith('Tarea', 'Detalle');
        expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue('');
    });

    it('al crear, acepta la fecha de hoy', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);

        renderWithProviders(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText(/^Título/), 'Tarea');
        await user.type(screen.getByLabelText(/^Descripción/), 'Detalle');
        await user.type(screen.getByLabelText('Fecha de vencimiento'), '09/11/2026');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(onSubmit).toHaveBeenCalledWith('Tarea', 'Detalle', '2026-11-09');
    });

    it('al editar, no permite fijar una fecha pasada nueva', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);
        const task = makeTask({ dueDate: '2026-11-20' });

        renderWithProviders(
            <TaskEditForm task={task} onSubmit={onSubmit} onCancel={vi.fn()} loading={false} />,
        );

        const input = screen.getByLabelText('Fecha de vencimiento');
        await user.clear(input);
        await user.type(input, '01/11/2026');
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        // La fecha pasada se ignora: solo queda el borrado hecho por el usuario.
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit.mock.calls[0][3]).toBeNull();
    });

    it('al editar, permite guardar una tarea cuyo vencimiento ya pasó si no se cambia la fecha', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);
        const task = makeTask({ dueDate: '2026-11-01' });

        renderWithProviders(
            <TaskEditForm task={task} onSubmit={onSubmit} onCancel={vi.fn()} loading={false} />,
        );

        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(onSubmit).toHaveBeenCalledWith(task.id, task.title, task.description);
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
