
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from 'firebase/firestore';

import { db } from './firebase';
import type { Task } from '../types/Task';

export function subscribeToUserTasks(
    userId: string,
    onTasks: (tasks: Task[]) => void,
    onError: (error: Error) => void,
) {
    const tasksCollection = collection(db, 'tasks');

    const tasksQuery = query(
        tasksCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
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

    return unsubscribe;
}
