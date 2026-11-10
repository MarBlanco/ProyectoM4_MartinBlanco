
import {
    addDoc,
    collection,
    deleteDoc,
    deleteField,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from './firebase';
import type { Task, TaskWriteData } from '../types/Task';

export function subscribeToUserTasks(
    userId: string,
    onTasks: (tasks: Task[]) => void,
    onError: (error: Error) => void,
) {
    const tasksCollection = collection(db, 'tasks');

    const tasksQuery = query(
        tasksCollection,
        where('userId', '==', userId),
    );

    return onSnapshot(
        tasksQuery,
        (snapshot) => {
            const tasks = snapshot.docs.map((document) => ({
                id: document.id,
                ...document.data({ serverTimestamps: 'estimate' }),
            } as Task));

            onTasks(tasks);
        },
        onError,
    );
}

export async function createTask(
    data: Omit<TaskWriteData, 'completed' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
    const taskData: TaskWriteData = {
        ...data,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const document = await addDoc(
        collection(db, 'tasks'),
        taskData,
    );

    return document.id;
}

export async function updateTask(
    taskId: string,
    data: Partial<Pick<TaskWriteData, 'title' | 'description'>> & {
        // string = fijar fecha; null = quitarla (se elimina el campo).
        dueDate?: string | null;
    },
): Promise<void> {
    const taskReference = doc(db, 'tasks', taskId);

    const { dueDate, ...rest } = data;

    await updateDoc(taskReference, {
        ...rest,
        ...(dueDate === undefined
            ? {}
            : { dueDate: dueDate === null ? deleteField() : dueDate }),
        updatedAt: serverTimestamp(),
    });
}

export async function deleteTask(taskId: string): Promise<void> {
    const taskReference = doc(db, 'tasks', taskId);

    await deleteDoc(taskReference);
}

export async function setTaskCompleted(
    taskId: string,
    completed: boolean,
): Promise<void> {
    const taskReference = doc(db, 'tasks', taskId);

    await updateDoc(taskReference, {
        completed,
        updatedAt: serverTimestamp(),
    });
}
