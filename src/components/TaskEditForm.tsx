import { Button, Group, Stack, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';

import type { Task } from '../types/Task';

interface TaskEditFormProps {
    task: Task;
    onSubmit: (
        taskId: string,
        title: string,
        description: string,
    ) => Promise<boolean>;
    onCancel: () => void;
    loading: boolean;
}

interface TaskEditFormValues {
    title: string;
    description: string;
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
        },
        validate: {
            title: (value) =>
                value.trim() ? null : 'El título es obligatorio.',
            description: (value) =>
                value.trim() ? null : 'La descripción es obligatoria.',
        },
    });

    async function handleSubmit(values: TaskEditFormValues) {
        const updated = await onSubmit(
            task.id,
            values.title.trim(),
            values.description.trim(),
        );

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
