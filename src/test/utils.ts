import type { Task } from '../types/Task';

// Promesa controlable desde el test para observar estados intermedios (carga).
export function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
    return {
        id: 'task-1',
        title: 'Comprar pan',
        description: 'En la panadería de la esquina',
        completed: false,
        userId: 'user-1',
        createdAt: {} as Task['createdAt'],
        updatedAt: {} as Task['updatedAt'],
        ...overrides,
    };
}
