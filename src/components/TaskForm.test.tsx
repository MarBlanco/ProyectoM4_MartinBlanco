import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import TaskForm from './TaskForm';

describe('TaskForm', () => {
    it('envía título y descripción sin espacios y limpia el formulario al crear', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);

        render(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText('Título'), '  Nueva tarea  ');
        await user.type(screen.getByLabelText('Descripción'), '  Detalle  ');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(onSubmit).toHaveBeenCalledWith('Nueva tarea', 'Detalle');
        expect(screen.getByLabelText('Título')).toHaveValue('');
        expect(screen.getByLabelText('Descripción')).toHaveValue('');
    });

    it('conserva los datos si la creación falla', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(false);

        render(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText('Título'), 'Tarea');
        await user.type(screen.getByLabelText('Descripción'), 'Detalle');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText('Título')).toHaveValue('Tarea');
        expect(screen.getByLabelText('Descripción')).toHaveValue('Detalle');
    });

    it('no envía si los campos solo tienen espacios', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText('Título'), '   ');
        await user.type(screen.getByLabelText('Descripción'), '   ');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('deshabilita los campos y muestra el estado de carga', () => {
        render(<TaskForm onSubmit={vi.fn()} loading />);

        expect(screen.getByRole('button', { name: 'Creando...' })).toBeDisabled();
        expect(screen.getByLabelText('Título')).toBeDisabled();
        expect(screen.getByLabelText('Descripción')).toBeDisabled();
    });
});
