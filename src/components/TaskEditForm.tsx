import { Button, Group, Stack, TextInput, Textarea } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconCalendar } from '@tabler/icons-react';

import type { Task } from '../types/Task';

interface TaskEditFormProps {
    task: Task;
    onSubmit: (
        taskId: string,
        title: string,
        description: string,
        dueDate?: string | null,
    ) => Promise<boolean>;
    onCancel: () => void;
    loading: boolean;
}

interface TaskEditFormValues {
    title: string;
    description: string;
    dueDate: string | null;
}

function TaskEditForm({
    task,
    onSubmit,
    onCancel,
    loading,
}: TaskEditFormProps) {
    const form = useForm<TaskEditFormValues>({
        initialValues: {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate ?? null,
        },
        validate: {
            title: (value) =>
                value.trim() ? null : 'El título es obligatorio.',
            description: (value) =>
                value.trim() ? null : 'La descripción es obligatoria.',
        },
    });

    async function handleSubmit(values: TaskEditFormValues) {
        const title = values.title.trim();
        const description = values.description.trim();

        // Si la fecha no cambió se mantiene la llamada original de tres argumentos.
        const updated =
            values.dueDate === (task.dueDate ?? null)
                ? await onSubmit(task.id, title, description)
                : await onSubmit(task.id, title, description, values.dueDate);

        if (updated) {
            onCancel();
        }
    }

    return (
        <form noValidate onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
                <TextInput
                    label="Título"
                    required
                    maxLength={100}
                    disabled={loading}
                    data-autofocus
                    {...form.getInputProps('title')}
                />

                <Textarea
                    label="Descripción"
                    required
                    autosize
                    minRows={3}
                    maxRows={8}
                    maxLength={1000}
                    disabled={loading}
                    {...form.getInputProps('description')}
                />

                <DateInput
                    label="Fecha de vencimiento"
                    placeholder="Opcional"
                    valueFormat="DD/MM/YYYY"
                    clearable
                    leftSection={<IconCalendar size={16} />}
                    disabled={loading}
                    {...form.getInputProps('dueDate')}
                />

                <Group justify="flex-end" mt="xs">
                    <Button
                        type="button"
                        variant="default"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>

                    <Button type="submit" loading={loading}>
                        {loading ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

export default TaskEditForm;
