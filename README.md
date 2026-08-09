# Bienestarte Integral

Sitio profesional y sistema de agendamiento de citas virtuales para **Orlandia Ortiz Almonte, M.A.** — psicoterapia clínica familiar y psicotrauma.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Firebase (Auth, Firestore, Storage) — con **modo demo** local si no hay `.env`
- React Router, date-fns, react-hot-toast, lucide-react

## Arranque rápido (modo demo)

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

**Admin demo**

- URL: `/admin/login`
- Email: `admin@bienestarteintegral.com`
- Contraseña: `bienestarte2026`

Los datos se guardan en `localStorage` del navegador hasta que configures Firebase.

## Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com).
2. Activa **Authentication** → Email/Password y crea el usuario admin.
3. Crea **Firestore** y **Storage**.
4. Copia `.env.example` a `.env` y pega las claves web:

```bash
cp .env.example .env
```

5. Despliega las reglas:

```bash
firebase deploy --only firestore:rules,storage
```

(Archivos: `firestore.rules`, `storage.rules`)

6. Reinicia `npm run dev`.

## Flujo de negocio

- Citas **solo virtuales**, lunes a viernes, **6 cupos/día** (por defecto 09:00–15:00 con hueco a las 13:00).
- El paciente agenda, paga por transferencia y **sube comprobante**.
- Estado inicial: `pending` → admin confirma o rechaza.
- Al confirmar se descarga un archivo `.ics` para el calendario del iPhone.

## Scripts

| Comando        | Descripción              |
|----------------|--------------------------|
| `npm run dev`  | Desarrollo               |
| `npm run build`| Build de producción      |
| `npm run preview` | Preview del build     |

## Deploy en Vercel

1. Conecta el repositorio a Vercel.
2. Framework preset: Vite.
3. Añade las variables `VITE_FIREBASE_*` en el proyecto.
4. `vercel.json` ya incluye el rewrite SPA.

## Estructura

```
src/
  pages/public/   # Inicio, Sobre mí, Servicios, Agendar, Mis citas
  pages/admin/    # Login, Dashboard, Citas, Pacientes, Disponibilidad, Config
  services/       # Firestore / localStorage
  lib/            # firebase, dates, ics, defaults
public/brand/     # Logos y fotos profesionales
```

## Credenciales profesionales

- CODOPSI 10-03029
- Exequátur 417-24
- Instagram: [@bienestarteintegral](https://www.instagram.com/bienestarteintegral)
