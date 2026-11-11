# Gestor de Tareas

Aplicación web desarrollada como **Proyecto Integrador del Módulo 4 de Henry**.

El proyecto permite que cada usuario ingrese con su cuenta de Google y administre sus propias tareas desde una interfaz sencilla. También puede consultar el estado de sus actividades y recibir un resumen por correo electrónico.

**Aplicación en producción:** [Ver Gestor de Tareas](https://proyecto-m4-martin-blanco.vercel.app)

**Repositorio:** [GitHub - ProyectoM4_MartinBlanco](https://github.com/MarBlanco/ProyectoM4_MartinBlanco)

**Demostración en video:** [Ver demo](docs/evidencias/demo-envio-email.mp4)

---

## Funcionalidades

- Inicio de sesión con Google y cierre de sesión.
- Sesión persistente al recargar la página.
- Acceso protegido: cada usuario puede ingresar únicamente a su espacio de trabajo.
- Creación, visualización, edición y eliminación de tareas.
- Actualización de tareas en tiempo real, sin necesidad de recargar la página.
- Posibilidad de marcar tareas como completadas o pendientes.
- Fecha de vencimiento opcional (no se puede elegir una fecha anterior a hoy).
- Vista de calendario mensual (alternable con la lista) con indicadores de tareas pendientes y completadas por día, y panel con las tareas del día seleccionado.
- Resumen visual con el total de tareas, pendientes y completadas.
- Envío por correo electrónico de un resumen de las tareas.
- Mensajes de carga, confirmación y error durante las operaciones.
- Diseño adaptable a celulares, tablets y computadoras.

## Tecnologías utilizadas

| Área | Tecnología |
|---|---|
| Frontend | React 19, TypeScript y Vite 8 |
| Navegación | React Router 7 |
| Interfaz | Mantine 9 y Tabler Icons |
| Autenticación | Firebase Authentication |
| Base de datos | Cloud Firestore |
| Envío de emails | AWS SES |
| Backend | Vercel Functions y Node.js |
| Administración de Firebase | Firebase Admin |
| Pruebas | Vitest y React Testing Library |
| Calidad de código | ESLint y TypeScript |
| Despliegue | Vercel |

## Cómo está organizado el proyecto

El proyecto está organizado para separar las pantallas, los componentes visuales y la lógica que trabaja con los datos.

Esta separación permite mantener el código ordenado y facilita realizar cambios sin afectar otras partes de la aplicación.

```text
├── api/
│   └── send-summary.ts
│
├── src/
│   ├── components/       # Componentes visuales reutilizables
│   ├── contexts/         # Administración de la sesión
│   ├── hooks/            # Lógica de autenticación y tareas
│   ├── pages/            # Pantallas de la aplicación
│   ├── routes/           # Protección de rutas
│   ├── services/         # Conexión con Firebase y Firestore
│   ├── types/            # Tipos de datos de TypeScript
│   ├── utils/            # Funciones auxiliares
│   ├── test/             # Configuración de pruebas
│   ├── theme.ts          # Tema visual de Mantine
│   └── styles.css        # Estilos generales
│
├── tests/
│   └── api/              # Pruebas de la función de email
│
├── firestore.rules       # Reglas de seguridad de la base de datos
├── vercel.json           # Rutas de la SPA y cabeceras de seguridad para Vercel
└── tsconfig.*.json       # Configuración de TypeScript
```

### Cómo funciona la aplicación

La aplicación utiliza diferentes herramientas, cada una con una responsabilidad específica:

- **React:** construye las pantallas y permite interactuar con la aplicación.
- **Firebase Authentication:** permite iniciar y cerrar sesión con Google.
- **Cloud Firestore:** almacena las tareas de cada usuario y actualiza los cambios en tiempo real.
- **Vercel Functions:** ejecuta la parte del servidor encargada de preparar y enviar el resumen por email.
- **AWS SES:** se encarga de enviar los correos electrónicos.

El código también está separado en distintas responsabilidades:

- Los componentes se ocupan de mostrar la interfaz.
- Los hooks administran la lógica y el estado de la aplicación.
- Los servicios se encargan de comunicarse con Firebase.
- Las rutas protegidas controlan quién puede acceder a cada pantalla.

De esta manera, cada parte tiene una función definida y el proyecto resulta más fácil de mantener.

## Base de datos y seguridad

Las tareas se almacenan en una colección de Firestore llamada `tasks`.

Cada documento representa una tarea y contiene los siguientes campos:

| Campo | Tipo | Descripción |
|---|---|---|
| `title` | string | Título de la tarea (1 a 100 caracteres). |
| `description` | string | Descripción (hasta 1000 caracteres). |
| `completed` | boolean | Indica si está completada. |
| `userId` | string | Identificador del usuario propietario. |
| `createdAt` | timestamp | Fecha de creación. |
| `updatedAt` | timestamp | Fecha de última actualización. |
| `dueDate` | string (opcional) | Fecha de vencimiento en formato `YYYY-MM-DD`. Las tareas anteriores no lo tienen y se interpretan como "sin fecha". |

### Protección de los datos

La seguridad no depende únicamente de ocultar información en la interfaz.

Se implementaron reglas de seguridad en Firestore para controlar las operaciones directamente sobre la base de datos.

Las reglas establecen que:

- Cada usuario puede consultar únicamente sus propias tareas.
- Solo el propietario puede modificar o eliminar sus tareas.
- No se permite cambiar el propietario de una tarea.
- Se validan los campos, los tipos de datos y sus límites.
- Cualquier operación que no esté expresamente permitida queda denegada.

Las reglas se encuentran en `firestore.rules`.

Para publicarlas se utiliza:

```bash
npx firebase-tools deploy --only firestore:rules
```

## Envío del resumen por email

Una de las funcionalidades del proyecto es permitir que cada usuario reciba por correo electrónico un resumen de sus tareas.

El envío se realiza desde el servidor mediante una función de Vercel y AWS SES.

### ¿Cómo funciona?

1. El usuario selecciona la opción **Enviar resumen por email**.
2. La aplicación obtiene el token de autenticación de Firebase.
3. El frontend envía una solicitud `POST` a `/api/send-summary`, incluyendo el token.
4. La función del servidor verifica que el token sea válido y que el email de la cuenta esté verificado.
5. Comprueba que el usuario no haya enviado otro resumen en el último minuto.
6. Obtiene las tareas correspondientes al usuario autenticado.
7. Prepara el contenido del correo y lo envía mediante AWS SES.
8. La aplicación muestra una notificación indicando el resultado de la operación.

El destinatario se obtiene de la cuenta autenticada. No se permite que el navegador elija libremente a qué dirección enviar el resumen.

### Seguridad del envío

Las credenciales de AWS y Firebase Admin se mantienen exclusivamente en el servidor. No se incluyen en el código que recibe el navegador.

Además, la función controla las solicitudes y evita procesar métodos HTTP no permitidos.

**Límite de envíos.** Cada usuario puede pedir un resumen como máximo una vez por minuto. El último envío se registra en la colección `summaryLimits/{uid}` de Firestore, que solo escribe el servidor (Admin SDK); las reglas de Firestore deniegan cualquier acceso desde el navegador. El límite **falla cerrado**: si Firestore no permite verificarlo, no se envía el correo y la API responde `503`. Si el envío falla después de reservar el cupo (por ejemplo, un error de SES), el cupo se libera para poder reintentar enseguida.

### Respuestas de la API

| Código HTTP | Significado |
|---|---|
| `200` | El envío fue aceptado correctamente. |
| `400` | La cuenta no tiene una dirección de email disponible. |
| `401` | Falta el token o no es válido. |
| `403` | El email de la cuenta no está verificado. |
| `405` | Se utilizó un método HTTP no permitido. |
| `429` | Se pidió otro resumen antes de que pase un minuto (incluye cabecera `Retry-After`). |
| `500` | Ocurrió un error interno o falta una configuración del servidor. |
| `503` | No se pudo verificar el límite de envíos; no se envió ningún correo. |

**Importante:** AWS SES puede trabajar en modo sandbox. En ese caso, tanto el remitente como el destinatario deben estar verificados en la misma región. Para enviar correos a destinatarios no verificados es necesario solicitar acceso a producción.

## Demostración en video

El archivo [`docs/evidencias/demo-envio-email.mp4`](docs/evidencias/demo-envio-email.mp4) muestra el recorrido de la aplicación en funcionamiento: se crea una tarea, se marca como completada y se solicita el resumen con el botón **Enviar resumen por email**.

- **Formato:** MP4 (H.264), 1920 × 806 px.
- **Duración:** unos 38 segundos, sin audio.
- **Tamaño:** 244 KB.

Para verlo, abrí el enlace desde GitHub (muestra un reproductor) o descargá el archivo.

## Instalación y ejecución local

### Requisitos

- Node.js 22.22.2 o superior, o 24.15 o superior.
- npm.
- Un proyecto de Firebase con Authentication y Cloud Firestore habilitados.
- El proveedor Google configurado en Firebase Authentication.

El proyecto fue verificado utilizando Node.js 24.

### 1. Clonar el repositorio

```bash
git clone https://github.com/MarBlanco/ProyectoM4_MartinBlanco.git
```

### 2. Ingresar a la carpeta

```bash
cd ProyectoM4_MartinBlanco
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Configurar las variables de entorno

Copiar el archivo `.env.example` y crear uno nuevo llamado `.env`.

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

En Git Bash o Linux:

```bash
cp .env.example .env
```

Completar las variables correspondientes antes de iniciar la aplicación.

### 5. Iniciar el proyecto

```bash
npm run dev
```

Vite iniciará el servidor de desarrollo y mostrará la dirección local para acceder a la aplicación.

**A tener en cuenta:** este comando inicia únicamente el frontend. La función de envío de email ubicada en `api/` necesita el entorno de Vercel para ejecutarse localmente.

Para probar también esa funcionalidad se puede utilizar:

```bash
vercel dev
```

En ese caso, también es necesario configurar las variables de entorno del servidor.

## Variables de entorno

El proyecto utiliza variables diferentes para el frontend y para el servidor.

### Frontend

Las variables que comienzan con `VITE_` forman parte de la configuración pública de la aplicación web de Firebase.

| Variable | Descripción |
|---|---|
| `VITE_FIREBASE_API_KEY` | API Key de Firebase. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación. |
| `VITE_FIREBASE_PROJECT_ID` | Identificador del proyecto. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de almacenamiento. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Identificador del remitente. |
| `VITE_FIREBASE_APP_ID` | Identificador de la aplicación. |

### Servidor

Estas variables son privadas y se configuran en el entorno del servidor. No deben llevar el prefijo `VITE_`.

| Variable | Descripción |
|---|---|
| `FIREBASE_PROJECT_ID` | Identificador del proyecto Firebase. |
| `FIREBASE_CLIENT_EMAIL` | Email de la cuenta de servicio. |
| `FIREBASE_PRIVATE_KEY` | Clave privada de Firebase Admin. |
| `AWS_ACCESS_KEY_ID` | Credencial de acceso de AWS. |
| `AWS_SECRET_ACCESS_KEY` | Clave secreta de AWS. |
| `AWS_REGION` | Región configurada en AWS SES. |
| `SES_FROM_EMAIL` | Dirección de email remitente verificada. |

**Importante:** el archivo `.env` contiene configuraciones privadas y no debe subirse al repositorio. El archivo `.env.example` sirve como referencia y no debe contener credenciales reales.

## Scripts disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Verifica los tipos y genera la versión de producción. |
| `npm run typecheck` | Comprueba los tipos de TypeScript. |
| `npm run lint` | Analiza el código con ESLint. |
| `npm test` | Ejecuta las pruebas automatizadas. |
| `npm run preview` | Permite visualizar localmente la versión compilada. |

## Pruebas y calidad

Se utilizaron Vitest y React Testing Library para comprobar el funcionamiento de diferentes partes de la aplicación.

Las pruebas cubren:

| Archivo | Qué se verifica |
|---|---|
| `TaskForm.test.tsx` | Creación de tareas y validaciones. |
| `TaskEditForm.test.tsx` | Edición, cancelación y validaciones. |
| `useTasks.test.ts` | Operaciones CRUD y actualización en tiempo real. |
| `useSendSummary.test.ts` | Envío del resumen y manejo de errores. |
| `AuthProvider.test.tsx` | Inicio de sesión, cierre de sesión y estado de autenticación. |
| `App.test.tsx` | Rutas públicas, privadas y redirecciones. |
| `LoginPage.test.tsx` | Pantalla de acceso y errores de autenticación. |
| `TasksPage.test.tsx` | Operaciones desde la interfaz y notificaciones. |
| `send-summary.test.ts` | Validaciones y respuestas de la API. |
| `static-security.test.ts` | Revisión estática: sin `eval`/`innerHTML`, reglas de Firestore y cabeceras de seguridad. |
| `TaskCalendar.test.tsx` | Calendario: días con tareas, indicadores, selección de día, navegación entre meses y día sin tareas. |
| `TaskDueDate.test.tsx` | Fecha de vencimiento al crear y editar (con, sin, modificar, quitar) y rechazo de fechas pasadas. |
| `TasksPageCalendar.test.tsx` | Selector Lista/Calendario y tareas antiguas sin fecha. |
| `taskService.test.ts` | Guardado y borrado de `dueDate` en Firestore (simulado). |
| `security.test.tsx` | XSS (HTML mostrado como texto) y textos con palabras SQL aceptados sin filtrar. |

En las pruebas automatizadas se utilizan servicios simulados (*mocks*) para Firebase, AWS SES y las solicitudes HTTP.

Esto permite comprobar el comportamiento del código sin depender de cuentas reales ni enviar correos durante cada ejecución.

Las pruebas automatizadas no reemplazan las verificaciones manuales con los servicios reales.

## Despliegue en Vercel

La aplicación está publicada en Vercel.

Para realizar el despliegue desde el repositorio:

1. Importar el repositorio de GitHub en Vercel.
2. Configurar las variables de entorno del frontend y del servidor.
3. Verificar la configuración de las rutas en `vercel.json`.
4. Agregar el dominio de producción en los dominios autorizados de Firebase Authentication.
5. Publicar las reglas de seguridad de Firestore.
6. Verificar la configuración del remitente y los permisos de AWS SES.

El archivo `vercel.json` permite que las rutas de la aplicación funcionen correctamente cuando se ingresa directamente a una página o se recarga el navegador, y define las cabeceras de seguridad HTTP.

## Seguridad y dependencias

Se tomaron medidas para proteger los datos y las credenciales del proyecto:

- Los archivos `.env` están excluidos del control de versiones.
- Las credenciales privadas permanecen en el servidor.
- La API verifica el token de Firebase antes de procesar una solicitud.
- Las consultas del servidor se limitan al usuario autenticado.
- Las reglas de Firestore controlan el acceso a los documentos.
- El contenido de las tareas se muestra como texto (React lo escapa) y el HTML del email escapa título y descripción.
- La API exige email verificado y limita los envíos por usuario (falla cerrado).
- `vercel.json` agrega las cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- Hay pruebas automáticas de seguridad (`src/security.test.tsx`, `tests/api/static-security.test.ts`).

### Estado de las dependencias

`npm audit` informa **14 paquetes afectados (4 altos y 10 moderados)**, que provienen de solo **3 advisories**. Los 14 se analizaron uno por uno y ninguno es explotable en esta aplicación. Siguen pendientes porque la única corrección que ofrece npm es un downgrade mayor.

| Advisory | Severidad | Paquete origen | Paquetes que lo arrastran | Ámbito |
|---|---|---|---|---|
| [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j) (CWE-295): `getAuthContext` puede devolver certificados no autorizados como autorizados | Alta | `@grpc/grpc-js` < 1.13.6 (instalado 1.9.16) | `@firebase/firestore`, `@firebase/firestore-compat`, `firebase` (4 paquetes) | Producción (SDK web) |
| [GHSA-f596-whhp-79r4](https://github.com/advisories/GHSA-f596-whhp-79r4) (CWE-550): el servidor gRPC envía al cliente mensajes de error de sus handlers | Baja (npm la agrupa en el paquete alto) | `@grpc/grpc-js` < 1.13.6 | los mismos 4 paquetes | Producción (SDK web) |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (CWE-405): denegación de servicio en `minimatch` por amplificación de patrones | Moderada | `minimatch` 7.0.0 – 11.0.0 (instalado 10.2.6) | `eslint`, `@eslint/js`, `@eslint/config-array`, `typescript-eslint` y 5 paquetes `@typescript-eslint/*` (10 paquetes) | Solo desarrollo |

**Riesgo residual**

- **`@grpc/grpc-js` (alta):** las dos fallas afectan al **servidor** gRPC (autenticación mutua TLS y errores que devuelve un servidor). Esta aplicación no levanta ningún servidor gRPC. El navegador usa el SDK web de Firestore por `fetch`/WebChannel, y se comprobó que el bundle generado (`dist/`) no contiene `grpc-js`. En `api/`, `firebase-admin` usa `@grpc/grpc-js` 1.14.7 (versión corregida) solo como cliente hacia Google. Riesgo residual: **bajo / no explotable**.
- **`minimatch` (moderada):** solo existe en la cadena de ESLint, que corre en desarrollo y en la integración, nunca en producción ni en el navegador. Para explotarla un atacante tendría que controlar los patrones glob que lee ESLint, que son los de este repositorio. Riesgo residual: **bajo**.

**Por qué no se corrigen ahora**

- `npm audit fix --force` instalaría `firebase@9.14.0` y `eslint@9.39.5`: downgrades mayores que romperían la aplicación y sus pruebas.
- `@firebase/firestore` fija `@grpc/grpc-js@~1.9.0`, incluso en la última versión publicada de `@firebase/firestore`. Forzar una versión nueva con `overrides` contradice esa dependencia y no aporta nada: el código afectado no se usa.
- Subir `minimatch` a 11 es una actualización mayor dentro de las herramientas de desarrollo, sin beneficio para el producto.

**Seguimiento:** volver a ejecutar `npm audit` cuando `@firebase/firestore` actualice `@grpc/grpc-js` o ESLint/typescript-eslint actualicen `minimatch`, y entonces actualizar con `npm update` y repetir las pruebas.

## Uso de inteligencia artificial durante el desarrollo

Durante el desarrollo utilicé herramientas de inteligencia artificial como apoyo para aprender, resolver problemas y mejorar el proyecto.

Las principales herramientas utilizadas fueron **ChatGPT** y **Claude Code (CC)**.

**ChatGPT** me ayudó a comprender conceptos, analizar errores, evaluar distintas soluciones y organizar las tareas de desarrollo. También lo utilicé para revisar decisiones técnicas y entender mejor cómo funcionaban las distintas partes de la aplicación.

**Claude Code** me permitió trabajar directamente sobre el código: revisar archivos, realizar modificaciones, preparar pruebas y comprobar que los cambios no afectaran funcionalidades que ya estaban funcionando.

La IA fue una herramienta de apoyo, pero no reemplazó mi participación en el desarrollo. Tuve que definir qué necesitaba resolver, revisar las propuestas, decidir qué cambios aceptar y comprobar los resultados.

Durante el proceso aprendí que no alcanza con pedirle a una IA que escriba código. Es importante entender qué está haciendo, revisar los cambios y verificar que realmente funcionen.

También aprendí a no aceptar automáticamente todas sus sugerencias. Algunas soluciones pueden parecer correctas, pero generar problemas en otras partes del proyecto.

Uno de los aprendizajes más importantes fue utilizar estas herramientas como apoyo para aprender y desarrollar, sin dejar de lado el criterio propio y la responsabilidad sobre el resultado final.

## Estado y verificaciones

El proyecto cuenta con pruebas automatizadas y una versión publicada en producción.

Para completar la validación final con los servicios reales, es importante comprobar:

- Inicio y cierre de sesión con Google.
- Persistencia de la sesión al recargar la aplicación.
- Creación, edición, finalización y eliminación de tareas en Firestore.
- Separación de los datos entre distintos usuarios.
- Envío real del resumen mediante AWS SES y recepción del correo.
- Acceso directo y recarga de la ruta `/tasks` en producción.
- Ausencia de errores en la consola del navegador.

Estas comprobaciones permiten complementar las pruebas automatizadas y verificar el funcionamiento de la aplicación en un entorno real.

---

**Proyecto Integrador — Módulo 4**

**Henry | Desarrollo Full Stack**

**Autor:** Martín Blanco