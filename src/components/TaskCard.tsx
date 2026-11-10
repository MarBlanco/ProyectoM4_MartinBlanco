import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Group,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';
import {
    IconArrowBackUp,
    IconCalendar,
    IconCheck,
    IconCircleCheck,
    IconClock,
    IconPencil,
    IconTrash,
} from '@tabler/icons-react';

import type { Task } from '../types/Task';
import { formatDueDate } from '../utils/dates';

interface TaskCardProps {
    task: Task;
    // Esta tarea tiene una operación en curso (completar o eliminar).
    busy: boolean;
    // Hay una operación en curso sobre cualquier tarea: se bloquean las acciones.
    disabled: boolean;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onToggleCompleted: (task: Task) => void;
}

function TaskCard({
    task,
    busy,
    disabled,
    onEdit,
    onDelete,
    onToggleCompleted,
}: TaskCardProps) {
    const accent = task.completed ? 'teal' : 'orange';
    const toggleLabel = task.completed
        ? 'Marcar como pendiente'
        : 'Marcar como completada';

    return (
        <Card
            withBorder
            padding="md"
            radius="md"
            style={{ borderLeft: `4px solid var(--mantine-color-${accent}-6)` }}
        >
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                <Title
                    order={3}
                    size="h4"
                    c={task.completed ? 'dimmed' : undefined}
                    td={task.completed ? 'line-through' : undefined}
                    style={{ overflowWrap: 'anywhere' }}
                >
                    {task.title}
                </Title>

                <Badge
                    color={accent}
                    variant="light"
                    leftSection={
                        task.completed ? <IconCircleCheck size={12} /> : <IconClock size={12} />
                    }
                    style={{
                        flexShrink: 0,
                        // Texto más oscuro que el del tema para cumplir contraste AA (WCAG).
                        color: task.completed ? '#065f46' : '#9a3412',
                    }}
                >
                    {task.completed ? 'Completada' : 'Pendiente'}
                </Badge>
            </Group>

            <Text
                size="sm"
                c="dimmed"
                mt="xs"
                style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
            >
                {task.description}
            </Text>

            {task.dueDate && (
                <Group gap={6} mt="xs" wrap="nowrap">
                    <IconCalendar size={14} aria-hidden />
                    <Text size="xs" c="dimmed">
                        Vence: {formatDueDate(task.dueDate)}
                    </Text>
                </Group>
            )}

            <Group mt="md" gap="xs" justify="space-between" wrap="nowrap">
                <Button
                    size="xs"
                    variant="light"
                    color={task.completed ? 'gray' : 'teal'}
                    c={task.completed ? 'gray.8' : '#065f46'}
                    leftSection={task.completed ? <IconArrowBackUp size={14} /> : <IconCheck size={14} />}
                    loading={busy}
                    disabled={disabled && !busy}
                    onClick={() => onToggleCompleted(task)}
                    aria-label={`${toggleLabel}: ${task.title}`}
                >
                    {toggleLabel}
                </Button>

                <Group gap={4} wrap="nowrap">
                    <Tooltip label="Editar" withArrow>
                        <ActionIcon
                            variant="default"
                            size="lg"
                            disabled={disabled}
                            onClick={() => onEdit(task)}
                            aria-label={`Editar: ${task.title}`}
                        >
                            <IconPencil size={16} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Eliminar" withArrow>
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            size="lg"
                            disabled={disabled}
                            onClick={() => onDelete(task)}
                            aria-label={`Eliminar: ${task.title}`}
                        >
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
        </Card>
    );
}

export default TaskCard;
