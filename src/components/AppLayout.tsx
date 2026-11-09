import {
    Anchor,
    AppShell,
    Button,
    Container,
    Group,
    Text,
    ThemeIcon,
} from '@mantine/core';
import { IconChecklist, IconLogout } from '@tabler/icons-react';
import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

// Estructura común de las pantallas privadas: barra superior con la marca,
// el usuario autenticado y el cierre de sesión.
function AppLayout() {
    const { user, logout } = useAuth();

    return (
        <AppShell header={{ height: 64 }}>
            <AppShell.Header>
                <Container size="lg" h="100%">
                    <Group h="100%" justify="space-between" wrap="nowrap">
                        <Anchor
                            component={Link}
                            to="/tasks"
                            underline="never"
                            c="inherit"
                        >
                            <Group gap="xs" wrap="nowrap">
                                <ThemeIcon size="lg" radius="md" aria-hidden>
                                    <IconChecklist size={20} />
                                </ThemeIcon>
                                <Text fw={700} fz="lg">
                                    Gestor de Tareas
                                </Text>
                            </Group>
                        </Anchor>

                        <Group gap="sm" wrap="nowrap">
                            <Text
                                size="sm"
                                c="dimmed"
                                visibleFrom="sm"
                                truncate
                                maw={260}
                            >
                                {user?.email}
                            </Text>

                            <Button
                                variant="default"
                                size="sm"
                                leftSection={<IconLogout size={16} />}
                                onClick={() => void logout()}
                            >
                                Cerrar sesión
                            </Button>
                        </Group>
                    </Group>
                </Container>
            </AppShell.Header>

            <AppShell.Main bg="gray.0">
                <Container size="lg" py="xl">
                    <Outlet />
                </Container>
            </AppShell.Main>
        </AppShell>
    );
}

export default AppLayout;
