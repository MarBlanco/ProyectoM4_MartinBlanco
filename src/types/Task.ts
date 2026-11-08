import type { FieldValue, Timestamp } from 'firebase/firestore';

// Documento tal como se guarda en Firestore (colección "tasks").
// El id NO es un campo: es el id del documento. Debe coincidir con firestore.rules.
interface TaskFields {
    title: string;
    description: string;
    completed: boolean;
    userId: string;
}

// Lectura: lo que devuelve Firestore.
// Ojo: mientras una escritura con serverTimestamp() está pendiente, el valor
// local puede ser null; al leer con onSnapshot conviene usar
// { serverTimestamps: 'estimate' } o contemplar ese caso.
export interface TaskData extends TaskFields {
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Escritura: createdAt/updatedAt se envían con serverTimestamp().
export interface TaskWriteData extends TaskFields {
    createdAt: FieldValue;
    updatedAt: FieldValue;
}

// Objeto usado por la aplicación: documento + id.
export interface Task extends TaskData {
    id: string;
}
