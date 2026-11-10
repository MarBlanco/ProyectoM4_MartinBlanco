import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TaskCalendar from './TaskCalendar';
import { renderWithProviders } from '../test/render';
import { makeTask } from '../test/utils';

const tasks = [
    makeTask({ id: '1', title: 'Pendiente del 20', dueDate: '2026-11-20' }),
    makeTask({ id: '2', title: 'Hecha del 20', dueDate: '2026-11-20', completed: true }),
    makeTask({ id: '3', title: 'Hecha del 25', dueDate: '2026-11-25', completed: true }),
    makeTask({ id: '4', title: 'Tarea antigua sin fecha' }),
    makeTask({ id: '5', title: 'De diciembre', dueDate: '2026-12-03' }),
];

function setup() {
    const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onToggleCompleted: vi.fn() };
    renderWithProviders(
        <TaskCalendar tasks={tasks} busyTaskId={null} busy={false} {...handlers} />,
    );
    return handlers;
}

function dayButton(day: number) {
    return screen.getByRole('button', { name: new RegExp(`^${day}(\\D|$)`) });
}

describe('TaskCalendar', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 9, 12) });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('muestra el mes actual y el día de hoy sin tareas', () => {
        setup();

        expect(screen.getByText(/noviembre 2026/i)).toBeInTheDocument();
        expect(screen.getByText('No hay tareas con vencimiento este día.')).toBeInTheDocument();
    });

    it('muestra las tareas en el día correcto al seleccionarlo', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(dayButton(20));

        const panel = screen.getByRole('region', { name: 'Tareas del día seleccionado' });
        expect(within(panel).getByText('Pendiente del 20')).toBeInTheDocument();
        expect(within(panel).getByText('Hecha del 20')).toBeInTheDocument();
        expect(within(panel).queryByText('Hecha del 25')).not.toBeInTheDocument();
        expect(within(panel).queryByText('Tarea antigua sin fecha')).not.toBeInTheDocument();
    });

    it('diferencia pendientes y completadas con indicadores', () => {
        setup();

        const withBoth = dayButton(20);
        expect(within(withBoth).getByTestId('dot-pending')).toBeInTheDocument();
        expect(within(withBoth).getByTestId('dot-completed')).toBeInTheDocument();

        const onlyDone = dayButton(25);
        expect(within(onlyDone).queryByTestId('dot-pending')).not.toBeInTheDocument();
        expect(within(onlyDone).getByTestId('dot-completed')).toBeInTheDocument();

        expect(within(dayButton(10)).queryByTestId('dot-pending')).not.toBeInTheDocument();
        expect(within(dayButton(10)).queryByTestId('dot-completed')).not.toBeInTheDocument();
    });

    it('navega entre meses', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
        expect(screen.getByText(/diciembre 2026/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: '3 diciembre 2026' }));
        expect(screen.getByText('De diciembre')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
        await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
        expect(screen.getByText(/octubre 2026/i)).toBeInTheDocument();
    });

    it('muestra un día sin tareas con un mensaje claro', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(dayButton(20));
        await user.click(dayButton(21));

        expect(screen.getByText('No hay tareas con vencimiento este día.')).toBeInTheDocument();
    });

    it('reutiliza las acciones de editar y eliminar', async () => {
        const user = userEvent.setup();
        const handlers = setup();

        await user.click(dayButton(25));
        await user.click(screen.getByRole('button', { name: 'Editar: Hecha del 25' }));
        await user.click(screen.getByRole('button', { name: 'Eliminar: Hecha del 25' }));

        expect(handlers.onEdit).toHaveBeenCalledWith(tasks[2]);
        expect(handlers.onDelete).toHaveBeenCalledWith(tasks[2]);
    });
});
