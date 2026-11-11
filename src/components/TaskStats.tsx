import { Flex, Paper, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
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
                    {/* Móvil: icono arriba del número (3 columnas angostas). Desde sm: en fila. */}
                    <Flex
                        direction={{ base: 'column', sm: 'row' }}
                        align={{ base: 'flex-start', sm: 'center' }}
                        gap={{ base: 6, sm: 'sm' }}
                    >
                        <ThemeIcon variant="light" color={color} size="lg" radius="md" aria-hidden>
                            <Icon size={20} />
                        </ThemeIcon>
                        <div style={{ minWidth: 0 }}>
                            <Text fz={{ base: 22, sm: 26 }} fw={700} lh={1.1} data-testid={`stat-${label}`}>
                                {value}
                            </Text>
                            <Text size="sm" c="dimmed" fz={{ base: 12, sm: 14 }}>
                                {label}
                            </Text>
                        </div>
                    </Flex>
                </Paper>
            ))}
        </SimpleGrid>
    );
}

export default TaskStats;
