import { Group, Paper, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import { IconCircleCheck, IconClock, IconListDetails } from '@tabler/icons-react';

interface TaskStatsProps {
    total: number;
    pending: number;
    completed: number;
}

interface StatItem {
    label: string;
    value: number;
    color: string;
    icon: typeof IconListDetails;
}

function TaskStats({ total, pending, completed }: TaskStatsProps) {
    const items: StatItem[] = [
        { label: 'Total', value: total, color: 'indigo', icon: IconListDetails },
        { label: 'Pendientes', value: pending, color: 'orange', icon: IconClock },
        { label: 'Completadas', value: completed, color: 'teal', icon: IconCircleCheck },
    ];

    return (
        <SimpleGrid
            cols={3}
            spacing={{ base: 'xs', sm: 'md' }}
            role="group"
            aria-label="Resumen de tareas"
        >
            {items.map(({ label, value, color, icon: Icon }) => (
                <Paper key={label} withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
                    <Group gap="sm" wrap="nowrap">
                        <ThemeIcon variant="light" color={color} size="lg" radius="md" aria-hidden>
                            <Icon size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fz={{ base: 22, sm: 26 }} fw={700} lh={1.1} data-testid={`stat-${label}`}>
                                {value}
                            </Text>
                            <Text size="sm" c="dimmed">
                                {label}
                            </Text>
                        </div>
                    </Group>
                </Paper>
            ))}
        </SimpleGrid>
    );
}

export default TaskStats;
