import type { Timestamp } from 'firebase/firestore';

export interface Task {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    userId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}