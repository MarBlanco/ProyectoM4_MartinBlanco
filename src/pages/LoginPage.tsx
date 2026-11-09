import { Alert, Button, Center, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconAlertCircle, IconBrandGoogle, IconChecklist } from '@tabler/icons-react';
import { Navigate } from 'react-router-dom';

import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const { user, loading, error, loginWithGoogle } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verificando autenticación..." />;
  }

  if (user) {
    return <Navigate to="/tasks" replace />;
  }

  return (
    <Center component="main" mih="100vh" bg="gray.0" p="md">
      <Paper withBorder shadow="md" radius="lg" p="xl" w="100%" maw={420}>
        <Stack gap="lg" align="center">
          <ThemeIcon size={56} radius="lg" aria-hidden>
            <IconChecklist size={32} />
          </ThemeIcon>

          <Stack gap={4} align="center">
            <Title order={1} ta="center">
              Gestor de Tareas
            </Title>
            <Text c="dimmed" ta="center">
              Organizá tus tareas diarias y accedé a ellas desde cualquier dispositivo.
            </Text>
          </Stack>

          <Stack gap="sm" w="100%">
            <Title order={2} size="h4" ta="center">
              Iniciar sesión
            </Title>

            <Button
              size="md"
              fullWidth
              leftSection={<IconBrandGoogle size={18} />}
              onClick={() => void loginWithGoogle()}
            >
              Iniciar sesión con Google
            </Button>

            {error && (
              <Alert color="red" icon={<IconAlertCircle size={18} />}>
                {error}
              </Alert>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Center>
  );
}

export default LoginPage;
