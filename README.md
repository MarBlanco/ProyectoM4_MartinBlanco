# Gestor de Tareas

Proyecto M4 de Henry: React + TypeScript + Vite + Firebase (Authentication y Cloud Firestore).

## Requisitos

- Node.js 20+
- Un proyecto de Firebase con Authentication (proveedor Google) y Firestore.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completar con las credenciales de Firebase
npm run dev
```

La app falla al arrancar con un mensaje claro si falta alguna variable `VITE_FIREBASE_*`.
El archivo `.env` está ignorado por git; no lo subas.

## Scripts

- `npm run dev`: servidor de desarrollo
- `npm run build`: typecheck (`tsc -b`) y build de producción
- `npm run lint`: ESLint

## Rutas

- `/login`: inicio de sesión con Google (redirige a `/tasks` si ya hay sesión)
- `/tasks`: privada; sin sesión redirige a `/login`
- cualquier otra: página 404

## Reglas de Firestore

Las reglas viven en `firestore.rules` y se vinculan en `firebase.json`.
Cada tarea pertenece a su `userId`: solo su dueño puede leerla, crearla, modificarla o borrarla,
y no se puede cambiar el dueño ni `createdAt`. Publicar con:

```bash
npx firebase-tools deploy --only firestore:rules
```

## Modelo de datos

Colección `tasks`: `title`, `description`, `completed`, `userId`, `createdAt`, `updatedAt`
(ver `src/types/Task.ts`).
