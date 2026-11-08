import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import TaskEditForm from './TaskEditForm';
import { makeTask } from '../test/utils';

describe('TaskEditForm', () => {
    const task = makeTask();

    it('muestra los valores actuales de la tarea', () => {
        render(
            <TaskEditForm
                task={task}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
                loading={false}
            />,
        );

        expect(screen.getByLabelText('Título')).toHaveValue(task.title);
        expect(screen.getByLabelText('Descripción')).toHaveValue(task.description);
    });

    it('guarda los cambios y cierra la edición si se actualiza', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);
        const onCancel = vi.fn();

        render(
            <TaskEditForm
                task={task}
                onSubmit={onSubmit}
                onCancel={onCancel}
                loading={false}
            />,
        );

        const title = screen.getByLabelText('Título');
        await user.clear(title);
        await user.type(title, '  Título editado ');
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(onSubmit).toHaveBeenCalledWith(
            task.id,
            'Título editado',
            task.description,
        );
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('mantiene la edición abierta si la actualización falla', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();

        render(
            <TaskEditForm
                task={task}
                onSubmit={vi.fn().mockResolvedValue(false)}
                onCancel={onCancel}
                loading={false}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(onCancel).not.toHaveBeenCalled();
    });

    it('cancela sin guardar', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onCancel = vi.fn();

        render(
            <TaskEditForm
                task={task}
                onSubmit={onSubmit}
                onCancel={onCancel}
                loading={false}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Cancelar' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('muestra el estado de carga', () => {
        render(
            <TaskEditForm
                task={task}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
                loading
            />,
        );

        expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });
});
