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

Si olvida la clave en producción: `/admin/login` → **¿Olvidaste tu contraseña?** → `/admin/recuperar`. El correo lo manda Firebase (en español) y, si configuraste `RESEND_API_KEY`, una copia con el sello de la práctica. Añade `bienestarteintegral.com` en Firebase Console → Authentication → Settings → Authorized domains para que el enlace abra esta misma página.

## Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com).
2. Activa **Authentication** → Email/Password y crea el usuario admin. En **Settings → Authorized domains** agrega el dominio del sitio (`bienestarteintegral.com`); si falta, el enlace de recuperar clave no puede devolverla al panel.
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

- Citas **solo virtuales**. La disponibilidad no está fija en el código: se configura desde `/admin/disponibilidad` (días activos, horarios, duración y fechas bloqueadas) y se valida en cada reserva con `getAvailability()` dentro de `assertBookable()` (`src/services/appointments.ts`).
- Valores por defecto: lunes a miércoles, 09:00–15:00 con hueco a las 13:00 (`DEFAULT_AVAILABILITY` en `src/lib/defaults.ts`), con un techo de **6 cupos/día** que el panel no deja superar.
- El paciente agenda, paga por transferencia y **sube comprobante**.
- Estado inicial: `pending` → admin confirma o rechaza.
- Al confirmar se descarga un archivo `.ics` para el calendario del iPhone.
- El paciente puede **reprogramar** su cita desde `/mis-citas` con su código, hasta 24 horas antes y como máximo 2 veces. **Cancelar nunca**: la interfaz siempre lo remite a contactar a la psicóloga.
- La psicóloga puede cancelar y reprogramar cualquier cita desde el panel, **sin la ventana de 24 horas**.

## Cómo funciona el bloqueo de cupos

El lock no vive en la cita: vive en una colección `slots` aparte, con un documento por horario tomado que guarda solo fecha, hora y el id de la cita.

- **Id determinista.** `slotId(date, time)` devuelve `${date}_${time}` (`src/services/slots.ts`). Como el id se puede calcular de antemano, crear el documento *es* la reserva.
- **Atomicidad delegada a Firestore.** `claimSlot()` (`appointments.ts:78`) crea ese documento dentro de una transacción: si ya existe, la transacción falla. Dos personas que envían la misma hora a la vez no pueden ganar ambas — la garantía es del motor, no de lógica de la app.
- **Orden en `createAppointment()`:** `assertBookable()` → `claimSlot()` → escribir la cita. El cupo se toma antes de crear cualquier otro registro; al revés dejaba pacientes huérfanos cada vez que el horario resultaba estar ocupado.
- **Rollback.** Si algo falla después del claim, el `catch` llama `releaseSlot()` (`appointments.ts:180`) para no dejar el horario bloqueado por una cita que nunca se completó.
- **Liberación por estado.** `updateAppointmentStatus()` libera el cupo solo si el nuevo estado no está en `ACTIVE_STATUSES` (`pending`, `confirmed`, `completed`): rechazar o cancelar devuelve el horario al calendario, confirmar y completar lo mantienen retenido (`appointments.ts:259`).
- **Reconciliación.** `reconcileData()` corre al abrir el panel admin y cuadra los locks con las citas en ambos sentidos: escribe los que falten para citas activas previas a este esquema, y borra los que ya no correspondan a ninguna cita activa (ver [Reprogramación](#reprogramación)). Es idempotente: usa el mismo id determinista, así que reconciliar dos veces no duplica nada.

**Privacidad por diseño.** La vista pública consulta `getBookedSlotsForDate()`, que lee únicamente la colección `slots` — nunca `appointments`. Un visitante ve qué horas están ocupadas sin acceso a nombres, teléfonos ni notas de pacientes.

**Modo demo.** Sin Firebase configurado el mismo flujo corre sobre `localStorage`, con un lock simplificado (`.some(s => s.id === id)`) en lugar de la transacción. Basta porque el navegador es monohilo y no hay concurrencia real que resolver.

## Reprogramación

Una sola función cubre a los dos actores: `rescheduleAppointment(reference, date, time, { actor })`
en `src/services/appointments.ts`. `actor` decide si aplica la ventana de 24 horas; la
mecánica es idéntica, así que no hay dos copias que puedan divergir.

- **La escritura es una transacción única de Firestore**: reclama el cupo nuevo y repunta la
  cita a la vez. Un fallo nunca deja al paciente sin ninguno de los dos.
- **La barrera real son las reglas**, no el cliente. `firestore.rules` permite `update` en
  `/appointments` solo si cambian los campos de reprogramación, el estado no se toca, el
  contador sube exactamente uno sin pasar de 2, y faltan más de 24 horas. Sin esa lista de
  campos, conocer un código bastaría para poner `status: 'confirmed'` y saltarse la revisión
  del comprobante.
- **La hora se ancla a UTC-4** (RD no tiene horario de verano) tanto en `src/lib/policy.ts`
  como en las reglas, para que la fecha límite no dependa del reloj del navegador. Los dos
  cálculos deben cambiarse juntos.
- **El paciente no borra su cupo viejo.** `/slots` solo permite `delete` a un usuario
  autenticado, a propósito: abrirlo dejaría que cualquiera liberase el horario reservado de
  otro. Por eso una reprogramación de paciente deja el cupo anterior ocupado hasta que
  `reconcileData()` lo limpie, al abrir el panel de Citas.

Las notificaciones de estos cambios aparecen en **Novedades**, en el Dashboard. No se envía
ningún correo al paciente ni a la psicóloga.

## Scripts

| Comando        | Descripción              |
|----------------|--------------------------|
| `npm run dev`  | Desarrollo               |
| `npm run build`| Build de producción      |
| `npm run preview` | Preview del build     |

## Deploy en Vercel

1. Conecta el repositorio a Vercel.
2. Framework preset: Vite.
3. Añade las variables `VITE_FIREBASE_*` y `SITE_URL` (`https://bienestarteintegral.com`) en el proyecto. El rewrite SPA y `/api/reset-password` ya están en `vercel.json`.
4. En Firebase Console → Authentication: Email/Password activo, y el dominio del sitio en **Authorized domains**. Sin eso el correo de recuperar clave no puede devolverla al panel.
5. Opcional, para una copia del correo con el nombre de la práctica: `RESEND_API_KEY`, `RESEND_FROM` y `FIREBASE_SERVICE_ACCOUNT` (esta última ya se usa en recordatorios).

Un push a `main` publica en producción. El panel de recuperar clave queda en `https://bienestarteintegral.com/admin/recuperar`.

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
