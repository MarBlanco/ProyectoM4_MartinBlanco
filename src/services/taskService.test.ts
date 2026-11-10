import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addDoc, updateDoc, deleteField } = vi.hoisted(() => ({
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteField: vi.fn(() => 'DELETE_FIELD'),
}));

vi.mock('firebase/firestore', () => ({
    addDoc,
    updateDoc,
    deleteField,
    collection: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TS'),
    where: vi.fn(),
}));
vi.mock('./firebase', () => ({ db: {} }));

import { createTask, updateTask } from './taskService';

beforeEach(() => {
    vi.clearAllMocks();
    addDoc.mockResolvedValue({ id: 'new' });
});

describe('taskService y dueDate', () => {
    it('crea con dueDate cuando se indica', async () => {
        await createTask({ title: 'T', description: 'D', userId: 'u', dueDate: '2026-11-20' });
        expect(addDoc.mock.calls[0][1]).toMatchObject({ dueDate: '2026-11-20', completed: false });
    });

    it('crea sin el campo dueDate cuando no se indica', async () => {
        await createTask({ title: 'T', description: 'D', userId: 'u' });
        expect(addDoc.mock.calls[0][1]).not.toHaveProperty('dueDate');
    });

    it('actualiza la fecha', async () => {
        await updateTask('1', { title: 'T', description: 'D', dueDate: '2026-12-01' });
        expect(updateDoc.mock.calls[0][1]).toMatchObject({ dueDate: '2026-12-01' });
    });

    it('quita la fecha eliminando el campo', async () => {
        await updateTask('1', { title: 'T', description: 'D', dueDate: null });
        expect(updateDoc.mock.calls[0][1]).toMatchObject({ dueDate: 'DELETE_FIELD' });
    });

    it('no toca la fecha si no se indica', async () => {
        await updateTask('1', { title: 'T', description: 'D' });
        expect(updateDoc.mock.calls[0][1]).not.toHaveProperty('dueDate');
    });
});
