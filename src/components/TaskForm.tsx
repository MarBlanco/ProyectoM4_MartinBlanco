import { Button, Stack, TextInput, Textarea, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus } from '@tabler/icons-react';

interface TaskFormProps {
    onSubmit: (title: string, description: string) => Promise<boolean>;
    loading: boolean;
}

interface TaskFormValues {
    title: string;
    description: string;
}

function TaskForm({ onSubmit, loading }: TaskFormProps) {
    const form = useForm<TaskFormValues>({
        initialValues: {
            title: '',
            description: '',
        },
        validate: {
            title: (value) =>
                value.trim() ? null : 'El título es obligatorio.',
            description: (value) =>
                value.trim() ? null : 'La descripción es obligatoria.',
        },
    });

    async function handleSubmit(values: TaskFormValues) {
        const success = await onSubmit(
            values.title.trim(),
            values.description.trim(),
        );

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
