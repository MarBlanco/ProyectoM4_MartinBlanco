import { Center, Loader, Stack, Text } from '@mantine/core';

interface LoadingScreenProps {
    message: string;
}

// Pantalla de espera a pantalla completa (verificación de sesión).
function LoadingScreen({ message }: LoadingScreenProps) {
    return (
        <Center mih="100vh" bg="gray.0">
            <Stack align="center" gap="sm" role="status">
                <Loader size="md" />
                <Text c="dimmed">{message}</Text>
            </Stack>
        </Center>
    );
}

export default LoadingScreen;
