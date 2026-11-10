import { useMemo, useState } from 'react';
import { Box, Group, Paper, SimpleGrid, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import dayjs from 'dayjs';

import type { Task } from '../types/Task';
import { todayString } from '../utils/dates';
import TaskCard from './TaskCard';

interface TaskCalendarProps {
    tasks: Task[];
    // Mismas props que usa la lista: el calendario reutiliza TaskCard y los handlers de la página.
    busyTaskId: string | null;
    busy: boolean;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onToggleCompleted: (task: Task) => void;
}

interface DayCounts {
    pending: number;
    completed: number;
}

function TaskCalendar({
    tasks,
    busyTaskId,
    busy,
    onEdit,
    onDelete,
    onToggleCompleted,
}: TaskCalendarProps) {
    const [selectedDate, setSelectedDate] = useState(todayString);
    const [visibleDate, setVisibleDate] = useState(todayString);

    // Solo las tareas con dueDate entran al calendario; las demás quedan en la lista.
    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>();

        for (const task of tasks) {
            if (!task.dueDate) {
                continue;
            }

            map.set(task.dueDate, [...(map.get(task.dueDate) ?? []), task]);
        }

        return map;
    }, [tasks]);

    function countsFor(date: string): DayCounts {
        const dayTasks = tasksByDate.get(date) ?? [];
        const completed = dayTasks.filter((task) => task.completed).length;

        return { completed, pending: dayTasks.length - completed };
    }

    const selectedTasks = tasksByDate.get(selectedDate) ?? [];
    const rawLabel = dayjs(selectedDate).locale('es').format('dddd D [de] MMMM [de] YYYY');
    const selectedLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

    return (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Paper withBorder p="md" radius="md">
                <Calendar
                    locale="es"
                    firstDayOfWeek={1}
                    date={visibleDate}
                    onDateChange={setVisibleDate}
                    previousLabel="Mes anterior"
                    nextLabel="Mes siguiente"
                    getDayProps={(date) => ({
                        selected: date === selectedDate,
                        onClick: () => setSelectedDate(date),
                    })}
                    renderDay={(date) => {
                        const { pending, completed } = countsFor(date);

                        return (
                            <Stack gap={2} align="center">
                                <span>{dayjs(date).format('D')}</span>
                                <Group gap={3} h={6} wrap="nowrap" aria-hidden>
                                    {pending > 0 && (
                                        <Box
                                            data-testid="dot-pending"
                                            w={6}
                                            h={6}
                                            style={{
                                                borderRadius: '50%',
                                                background: 'var(--mantine-color-orange-6)',
                                            }}
                                        />
                                    )}
                                    {completed > 0 && (
                                        <Box
                                            data-testid="dot-completed"
                                            w={6}
                                            h={6}
                                            style={{
                                                borderRadius: '50%',
                                                background: 'var(--mantine-color-teal-6)',
                                            }}
                                        />
                                    )}
                                </Group>
                                {(pending > 0 || completed > 0) && (
                                    <VisuallyHidden>
                                        {`${pending} pendientes, ${completed} completadas`}
                                    </VisuallyHidden>
                                )}
                            </Stack>
                        );
                    }}
                />

                <Group gap="md" mt="sm">
                    <Group gap={6}>
                        <Box
                            w={8}
                            h={8}
                            style={{ borderRadius: '50%', background: 'var(--mantine-color-orange-6)' }}
                        />
                        <Text size="xs" c="dimmed">Pendientes</Text>
                    </Group>
                    <Group gap={6}>
                        <Box
                            w={8}
                            h={8}
                            style={{ borderRadius: '50%', background: 'var(--mantine-color-teal-6)' }}
                        />
                        <Text size="xs" c="dimmed">Completadas</Text>
                    </Group>
                </Group>
            </Paper>

            <Stack gap="sm" aria-label="Tareas del día seleccionado" role="region">
                <Title order={3} size="h5">
                    {selectedLabel}
                </Title>

                {selectedTasks.length === 0 ? (
                    <Paper withBorder p="lg" radius="md" ta="center">
                        <Text c="dimmed" size="sm">
                            No hay tareas con vencimiento este día.
                        </Text>
                    </Paper>
                ) : (
                    selectedTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            busy={busyTaskId === task.id && busy}
                            disabled={busy}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleCompleted={onToggleCompleted}
                        />
                    ))
                )}
            </Stack>
        </SimpleGrid>
    );
}

export default TaskCalendar;
