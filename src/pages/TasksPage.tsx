import { useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Grid,
    Modal,
    Group,
    Paper,
    SegmentedControl,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
    Title,
    VisuallyHidden,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconAlertCircle, IconMail, IconSend, IconClipboardList } from '@tabler/icons-react';

import TaskCalendar from '../components/TaskCalendar';
import TaskCard from '../components/TaskCard';
import TaskEditForm from '../components/TaskEditForm';
import TaskForm from '../components/TaskForm';
import TaskStats from '../components/TaskStats';
import { useAuth } from '../hooks/useAuth';
import { useSendSummary } from '../hooks/useSendSummary';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../types/Task';
import { notifyError, notifySuccess } from '../utils/notify';

export default function TasksPage() {
    const { user } = useAuth();

    const {
        tasks,
        loading,
        creating,
        updating,
        deleting,
        completing,
        error,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskCompleted,
    } = useTasks(user?.uid);

    const { sending, sendSummary } = useSendSummary(user);

    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'calendar'>('list');

    const stats = useMemo(() => {
        const completed = tasks.filter((task) => task.completed).length;

        return {
            total: tasks.length,
            completed,
            pending: tasks.length - completed,
        };
    }, [tasks]);

    // dueDate viaja como argumento opcional: sin fecha, el CRUD recibe la misma llamada de siempre.
    async function handleCreate(
        title: string,
        description: string,
        ...dueDate: [dueDate?: string]
    ) {
        const created = await createTask(title, description, ...dueDate);

        if (created) {
            notifySuccess('La tarea se creó correctamente.');
        }

        return created;
    }

    async function handleUpdate(
        taskId: string,
        title: string,
        description: string,
        ...dueDate: [dueDate?: string | null]
    ) {
        const updated = await updateTask(taskId, title, description, ...dueDate);

        if (updated) {
            notifySuccess('La tarea se actualizó correctamente.');
        }

        return updated;
    }

    function handleDelete(task: Task) {
        modals.openConfirmModal({
            title: 'Eliminar tarea',
            centered: true,
            children: (
                <Text size="sm">
                    ¿Estás seguro de que querés eliminar la tarea «{task.title}»?
                    Esta acción no se puede deshacer.
                </Text>
            ),
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            closeButtonProps: { 'aria-label': 'Cerrar' },
            onConfirm: async () => {
                setBusyTaskId(task.id);
                const deleted = await deleteTask(task.id);
                setBusyTaskId(null);

                if (deleted) {
                    notifySuccess('La tarea se eliminó correctamente.');

                    if (editingTask?.id === task.id) {
                        setEditingTask(null);
                    }
                }
            },
        });
    }

    async function handleToggleCompleted(task: Task) {
        setBusyTaskId(task.id);
        const toggled = await toggleTaskCompleted(task.id, !task.completed);
        setBusyTaskId(null);

        if (toggled) {
            notifySuccess(
                task.completed
                    ? 'La tarea volvió a quedar pendiente.'
                    : 'La tarea se marcó como completada.',
            );
        }
    }

    async function handleSendSummary() {
        const result = await sendSummary();

        if (!result) {
            return;
        }

        if (result.ok) {
            notifySuccess(result.message, 'Resumen enviado');
        } else {
            notifyError(result.message, 'No se pudo enviar el resumen');
        }
    }

    if (loading) {
        return (
            <Stack gap="lg" aria-busy="true">
                <VisuallyHidden role="status">Cargando tareas...</VisuallyHidden>
                <Skeleton h={48} w={240} />
                <SimpleGrid cols={3} spacing="md">
                    <Skeleton h={110} />
                    <Skeleton h={110} />
                    <Skeleton h={110} />
                </SimpleGrid>
                <Skeleton h={220} />
            </Stack>
        );
    }

    return (
        <Stack gap="lg" className="tasks-page">
            <div>
                <Title order={1}>Mis tareas</Title>
                <Text c="dimmed">
                    Organizá y seguí el estado de tus tareas diarias.
                </Text>
            </div>

            <TaskStats
                total={stats.total}
                pending={stats.pending}
                completed={stats.completed}
            />

            {error && (
                <Alert
                    color="red"
                    title="Ocurrió un problema"
                    icon={<IconAlertCircle size={18} />}
                >
                    {error}
                </Alert>
            )}

            <Grid gap="lg" className="tasks-grid">
                <Grid.Col span={{ base: 12, lg: 4 }} className="tasks-col">
                    <Stack gap="lg">
                        <Paper withBorder p="lg" radius="md">
                            <TaskForm onSubmit={handleCreate} loading={creating} />
                        </Paper>

                        <Paper withBorder p="lg" radius="md">
                            <Stack gap="sm">
                                <Title order={2} size="h4">
                                    Resumen por email
                                </Title>

                                <Text size="sm" c="dimmed">
                                    Recibí en tu correo un resumen con el estado
                                    de todas tus tareas.
                                </Text>

                                <Button
                                    variant="light"
                                    fullWidth
                                    loading={sending}
                                    leftSection={
                                        sending ? <IconSend size={16} /> : <IconMail size={16} />
                                    }
                                    onClick={() => void handleSendSummary()}
                                >
                                    {sending
                                        ? 'Enviando resumen...'
                                        : 'Enviar resumen por email'}
                                </Button>
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 8 }} className="tasks-col">
                    <Group justify="space-between" mb="md">
                        <Title order={2} size="h4">
                            Tus tareas
                        </Title>

                        <SegmentedControl
                            value={view}
                            onChange={(value) => setView(value as 'list' | 'calendar')}
                            data={[
                                { value: 'list', label: 'Lista' },
                                { value: 'calendar', label: 'Calendario' },
                            ]}
                            aria-label="Vista de tareas"
                        />
                    </Group>

                    {view === 'calendar' ? (
                        <TaskCalendar
                            tasks={tasks}
                            busyTaskId={busyTaskId}
                            busy={deleting || completing}
                            onEdit={setEditingTask}
                            onDelete={handleDelete}
                            onToggleCompleted={(selected) =>
                                void handleToggleCompleted(selected)
                            }
                        />
                    ) : tasks.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" ta="center">
                            <Stack align="center" gap="xs">
                                <ThemeIcon variant="light" size={56} radius="xl" aria-hidden>
                                    <IconClipboardList size={28} />
                                </ThemeIcon>
                                <Text fw={600}>Todavía no tenés tareas.</Text>
                                <Text size="sm" c="dimmed">
                                    Creá la primera con el formulario.
                                </Text>
                            </Stack>
                        </Paper>
                    ) : (
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            {tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    busy={
                                        busyTaskId === task.id &&
                                        (deleting || completing)
                                    }
                                    disabled={deleting || completing}
                                    onEdit={setEditingTask}
                                    onDelete={handleDelete}
                                    onToggleCompleted={(selected) =>
                                        void handleToggleCompleted(selected)
                                    }
                                />
                            ))}
                        </SimpleGrid>
                    )}
                </Grid.Col>
            </Grid>

            <Modal
                opened={editingTask !== null}
                onClose={() => {
                    // Mientras se guarda no se puede cerrar: la respuesta pendiente
                    // cerraría el modal de otra tarea que se abra después.
                    if (!updating) {
                        setEditingTask(null);
                    }
                }}
                title="Editar tarea"
                centered
                withCloseButton={!updating}
                closeOnClickOutside={!updating}
                closeOnEscape={!updating}
                closeButtonProps={{ 'aria-label': 'Cerrar' }}
            >
                {editingTask && (
                    <TaskEditForm
                        key={editingTask.id}
                        task={editingTask}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingTask(null)}
                        loading={updating}
                    />
                )}
            </Modal>
        </Stack>
    );
}
