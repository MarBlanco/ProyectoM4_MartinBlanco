import { Button, Stack, TextInput, Textarea, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconCalendar, IconPlus } from '@tabler/icons-react';

import { todayString } from '../utils/dates';

interface TaskFormProps {
    onSubmit: (
        title: string,
        description: string,
        dueDate?: string,
    ) => Promise<boolean>;
    loading: boolean;
}

interface TaskFormValues {
    title: string;
    description: string;
    dueDate: string | null;
}

function TaskForm({ onSubmit, loading }: TaskFormProps) {
    const form = useForm<TaskFormValues>({
        initialValues: {
            title: '',
            description: '',
            dueDate: null,
        },
        validate: {
            title: (value) =>
                value.trim() ? null : 'El título es obligatorio.',
            description: (value) =>
                value.trim() ? null : 'La descripción es obligatoria.',
            dueDate: (value) =>
                value && value < todayString()
                    ? 'La fecha no puede ser anterior a hoy.'
                    : null,
        },
    });

    async function handleSubmit(values: TaskFormValues) {
        const title = values.title.trim();
        const description = values.description.trim();

        // Sin fecha se mantiene la llamada original de dos argumentos.
        const success = values.dueDate
            ? await onSubmit(title, description, values.dueDate)
            : await onSubmit(title, description);

        if (success) {
            form.reset();
        }
    }

    // noValidate: la validación la hace Mantine, con mensajes en español.
    return (
        <form noValidate onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
                <Title order={2} size="h4">
                    Nueva tarea
                </Title>

                <TextInput
                    label="Título"
                    placeholder="Ej.: Preparar la entrega"
                    required
                    maxLength={100}
                    disabled={loading}
                    {...form.getInputProps('title')}
                />

                <Textarea
                    label="Descripción"
                    placeholder="Contá de qué se trata la tarea"
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
                    minDate={todayString()}
                    leftSection={<IconCalendar size={16} />}
                    disabled={loading}
                    {...form.getInputProps('dueDate')}
                />

                <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    leftSection={<IconPlus size={16} />}
                >
                    {loading ? 'Creando...' : 'Crear tarea'}
                </Button>
            </Stack>
        </form>
    );
}

export default TaskForm;
