import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import TaskForm from './TaskForm';
import { renderWithProviders } from '../test/render';

describe('TaskForm', () => {
    it('envía título y descripción sin espacios y limpia el formulario al crear', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(true);

        renderWithProviders(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText(/^Título/), '  Nueva tarea  ');
        await user.type(screen.getByLabelText(/^Descripción/), '  Detalle  ');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(onSubmit).toHaveBeenCalledWith('Nueva tarea', 'Detalle');
        expect(screen.getByLabelText(/^Título/)).toHaveValue('');
        expect(screen.getByLabelText(/^Descripción/)).toHaveValue('');
    });

    it('conserva los datos si la creación falla', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(false);

        renderWithProviders(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText(/^Título/), 'Tarea');
        await user.type(screen.getByLabelText(/^Descripción/), 'Detalle');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText(/^Título/)).toHaveValue('Tarea');
        expect(screen.getByLabelText(/^Descripción/)).toHaveValue('Detalle');
    });

    it('muestra los mensajes de validación y no envía si los campos están vacíos', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        renderWithProviders(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(await screen.findByText('El título es obligatorio.')).toBeInTheDocument();
        expect(screen.getByText('La descripción es obligatoria.')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('no envía si los campos solo tienen espacios', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        renderWithProviders(<TaskForm onSubmit={onSubmit} loading={false} />);

        await user.type(screen.getByLabelText(/^Título/), '   ');
        await user.type(screen.getByLabelText(/^Descripción/), '   ');
        await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

        expect(await screen.findByText('El título es obligatorio.')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('deshabilita los campos y muestra el estado de carga', () => {
        renderWithProviders(<TaskForm onSubmit={vi.fn()} loading />);

        expect(screen.getByRole('button', { name: 'Creando...' })).toBeDisabled();
        expect(screen.getByLabelText(/^Título/)).toBeDisabled();
        expect(screen.getByLabelText(/^Descripción/)).toBeDisabled();
    });
});
