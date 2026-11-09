import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <Center component="main" mih="100vh" bg="gray.0" p="md">
      <Stack align="center" gap="sm" ta="center">
        <Text fz={64} fw={800} c="indigo" lh={1} aria-hidden>
          404
        </Text>

        <Title order={1}>Página no encontrada</Title>

        <Text c="dimmed">La dirección que buscás no existe.</Text>

        <Button component={Link} to="/tasks" mt="sm">
          Ir a mis tareas
        </Button>
      </Stack>
    </Center>
  );
}

export default NotFoundPage;
