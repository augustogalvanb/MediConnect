# MediConnect - Frontend Web 🌐

Aplicación web moderna para gestión de clínicas médicas desarrollada con **Next.js**, **React**, **TypeScript** y **Tailwind CSS**.

---

## 📋 Descripción

El frontend de MediConnect es una aplicación web responsive y moderna que proporciona interfaces intuitivas para:

- **Pacientes**: Reservar turnos, ver historial médico, chatear con soporte
- **Médicos**: Gestionar agenda, atender pacientes, crear historiales médicos
- **Administradores**: Panel de control completo, gestión de usuarios, estadísticas

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
Next.js 15.5.5 (Framework React con App Router)
├── React 19.1.0 (Librería UI)
├── TypeScript 5.x (Tipado estático)
├── Tailwind CSS 4.x (Framework CSS)
├── shadcn/ui (Componentes UI)
├── Axios 1.12.2 (Cliente HTTP)
├── Socket.io Client 4.8.1 (WebSockets)
├── React Hook Form 7.65.0 (Formularios)
├── Zod 4.1.12 (Validación)
├── Recharts 3.2.1 (Gráficos)
├── Lucide React (Iconografía)
└── next-themes (Tema claro/oscuro)
```

### Estructura de Carpetas

```
front/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage
│   ├── login/                    # Inicio de sesión
│   ├── register/                 # Registro de usuarios
│   │
│   └── dashboard/                # Dashboards por rol
│       ├── layout.tsx            # Layout compartido (sidebar, navbar)
│       │
│       ├── patient/              # Dashboard de Paciente
│       │   ├── page.tsx          # Panel principal
│       │   ├── appointments/     # Gestión de turnos
│       │   │   ├── page.tsx      # Lista de turnos
│       │   │   ├── new/page.tsx  # Reservar turno
│       │   │   └── [id]/page.tsx # Detalle de turno
│       │   ├── records/page.tsx  # Historial médico
│       │   └── chat/page.tsx     # Chat de soporte
│       │
│       ├── doctor/               # Dashboard de Médico
│       │   ├── page.tsx          # Panel principal
│       │   ├── appointments/     # Citas del médico
│       │   │   ├── page.tsx
│       │   │   └── [id]/page.tsx
│       │   ├── patients/         # Pacientes atendidos
│       │   │   ├── page.tsx
│       │   │   └── [id]/page.tsx
│       │   ├── availability/page.tsx  # Gestión de horarios
│       │   └── records/          # Historiales médicos
│       │       ├── page.tsx
│       │       └── new/page.tsx
│       │
│       └── admin/                # Dashboard Administrativo
│           ├── page.tsx          # Panel de control
│           ├── patients/         # Gestión de pacientes
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── doctors/page.tsx  # Gestión de médicos
│           ├── appointments/     # Todas las citas
│           │   ├── page.tsx
│           │   └── [id]/page.tsx
│           ├── payments/page.tsx # Sistema de pagos
│           ├── stats/page.tsx    # Estadísticas y reportes
│           └── chat/page.tsx     # Centro de soporte
│
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── alert.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── calendar.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── separator.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── ProtectedRoute.tsx        # HOC para rutas protegidas
│   └── theme-provider.tsx        # Proveedor de temas
│
├── context/                      # Context API
│   ├── AuthContext.tsx           # Autenticación global
│   └── ChatContext.tsx           # Chat en tiempo real
│
├── lib/                          # Utilidades
│   ├── api.ts                    # Cliente HTTP configurado
│   └── utils.ts                  # Funciones helper
│
├── public/                       # Archivos estáticos
│   ├── images/
│   └── icons/
│
├── package.json                  # Dependencias
├── tsconfig.json                 # Configuración TypeScript
├── tailwind.config.ts            # Configuración Tailwind
├── next.config.ts                # Configuración Next.js
└── .env.local                    # Variables de entorno
```

---

## 🎨 Componentes UI

### Componentes Base (shadcn/ui)

Todos los componentes están construidos sobre **Radix UI** con estilos de **Tailwind CSS**:

| Componente | Uso | Ubicación |
|------------|-----|-----------|
| `Button` | Botones con variantes | `/components/ui/button.tsx` |
| `Card` | Tarjetas de contenido | `/components/ui/card.tsx` |
| `Input` | Campos de entrada | `/components/ui/input.tsx` |
| `Select` | Selectores dropdown | `/components/ui/select.tsx` |
| `Dialog` | Modales y diálogos | `/components/ui/dialog.tsx` |
| `Alert` | Alertas y mensajes | `/components/ui/alert.tsx` |
| `Avatar` | Avatares de usuario | `/components/ui/avatar.tsx` |
| `Badge` | Insignias de estado | `/components/ui/badge.tsx` |
| `Calendar` | Selector de fechas | `/components/ui/calendar.tsx` |
| `Table` | Tablas de datos | `/components/ui/table.tsx` |
| `Tabs` | Pestañas de navegación | `/components/ui/tabs.tsx` |

### Componentes Personalizados

- **ProtectedRoute**: HOC para proteger rutas según rol de usuario
- **theme-provider**: Manejo de tema claro/oscuro

---

## 🔐 Autenticación y Autorización

### AuthContext

El contexto de autenticación (`/context/AuthContext.tsx`) proporciona:

```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'receptionist' | 'admin';
  isEmailVerified: boolean;
  avatar?: string;
}
```

### Flujo de Autenticación

1. Usuario ingresa a `/login` o `/register`
2. Completa formulario con validación (React Hook Form + Zod)
3. Al autenticarse, recibe JWT token
4. Token se almacena en `localStorage`
5. Se redirige según rol:
   - `patient` → `/dashboard/patient`
   - `doctor` → `/dashboard/doctor`
   - `admin` o `receptionist` → `/dashboard/admin`
6. Todas las peticiones incluyen token en header `Authorization: Bearer <token>`

### Protección de Rutas

```typescript
// Ejemplo de uso
<ProtectedRoute allowedRoles={['patient']}>
  <PatientDashboard />
</ProtectedRoute>
```

---

## 👨‍⚕️ Módulos por Rol

### 1. Dashboard de Paciente

**Ruta base**: `/dashboard/patient`

#### Páginas:

| Ruta | Descripción |
|------|-------------|
| `/dashboard/patient` | Panel principal con estadísticas |
| `/dashboard/patient/appointments` | Lista de turnos (próximos/pasados) |
| `/dashboard/patient/appointments/new` | Formulario para reservar turno |
| `/dashboard/patient/appointments/[id]` | Detalle de turno específico |
| `/dashboard/patient/records` | Historial médico personal |
| `/dashboard/patient/chat` | Chat de soporte en tiempo real |

#### Funcionalidades:

- ✅ Ver estadísticas: turnos totales, próximos, historial
- ✅ Reservar nuevo turno:
  - Seleccionar médico por especialidad
  - Calendario interactivo con disponibilidad
  - Elegir horario disponible
  - Tipo de consulta (presencial/online)
  - Motivo de consulta
- ✅ Ver historial de turnos (próximos y pasados)
- ✅ Cancelar turnos con razón
- ✅ Acceder a historial médico completo
- ✅ Chat en vivo con recepción

---

### 2. Dashboard de Médico

**Ruta base**: `/dashboard/doctor`

#### Páginas:

| Ruta | Descripción |
|------|-------------|
| `/dashboard/doctor` | Panel principal con agenda |
| `/dashboard/doctor/appointments` | Lista de citas del médico |
| `/dashboard/doctor/appointments/[id]` | Detalle y gestión de cita |
| `/dashboard/doctor/patients` | Listado de pacientes atendidos |
| `/dashboard/doctor/patients/[id]` | Perfil e historial del paciente |
| `/dashboard/doctor/availability` | Configurar disponibilidad horaria |
| `/dashboard/doctor/records` | Historiales médicos creados |
| `/dashboard/doctor/records/new` | Crear nuevo registro médico |

#### Funcionalidades:

- ✅ Ver agenda del día
- ✅ Estadísticas: turnos hoy, próximos 7 días, pacientes atendidos
- ✅ Confirmar/completar/cancelar citas
- ✅ Gestionar disponibilidad:
  - Configurar horarios por día de la semana
  - Múltiples franjas horarias
  - Duración de slots (30 min por defecto)
- ✅ Ver información completa de pacientes
- ✅ Crear historiales médicos:
  - Motivo de consulta
  - Diagnóstico
  - Tratamiento
  - Signos vitales
  - Medicamentos
  - Notas de seguimiento
- ✅ Cargar documentos médicos (estudios, recetas)

---

### 3. Dashboard Administrativo

**Ruta base**: `/dashboard/admin`

#### Páginas:

| Ruta | Descripción |
|------|-------------|
| `/dashboard/admin` | Panel de control con métricas |
| `/dashboard/admin/patients` | Gestión de pacientes |
| `/dashboard/admin/patients/[id]` | Perfil de paciente |
| `/dashboard/admin/doctors` | Gestión de médicos |
| `/dashboard/admin/appointments` | Todas las citas de la clínica |
| `/dashboard/admin/appointments/[id]` | Detalle de cita |
| `/dashboard/admin/payments` | Sistema de pagos y facturación |
| `/dashboard/admin/stats` | Estadísticas y reportes avanzados |
| `/dashboard/admin/chat` | Centro de soporte por chat |

#### Funcionalidades:

- ✅ Dashboard con KPIs:
  - Total de pacientes
  - Médicos activos
  - Turnos del día
  - Ingresos del mes
- ✅ Gestionar usuarios:
  - Crear/editar/eliminar pacientes
  - Crear/editar/eliminar médicos
  - Ver información completa
- ✅ Gestionar todas las citas:
  - Crear turnos manuales
  - Confirmar/cancelar citas
  - Filtrar por doctor, paciente, fecha
- ✅ Sistema de pagos:
  - Registrar pagos
  - Métodos: efectivo, tarjetas, transferencia, seguros
  - Ver ingresos totales
  - Procesar reembolsos
- ✅ Estadísticas avanzadas:
  - Gráficos de rendimiento
  - Doctores más solicitados
  - Métodos de pago más usados
  - Ocupación de clínica
- ✅ Centro de chat:
  - Ver todos los chats activos
  - Asignar agentes
  - Historial de conversaciones
  - Indicadores de mensajes sin leer

---

## 💬 Chat en Tiempo Real

### ChatContext

El contexto de chat (`/context/ChatContext.tsx`) gestiona:

```typescript
interface ChatContextType {
  connected: boolean;
  roomId: string | null;
  messages: Message[];
  isTyping: boolean;
  startChat: (initialMessage: string, guestName?: string, guestEmail?: string) => void;
  sendMessage: (content: string) => void;
  joinRoom: (roomId: string, isAgent?: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  disconnect: () => void;
}

interface Message {
  id: string;
  sender?: string;
  senderType: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  isRead: boolean;
}
```

### Eventos WebSocket

- `connection` - Conexión establecida
- `startChat` - Iniciar nuevo chat
- `sendMessage` - Enviar mensaje
- `joinRoom` - Unirse a sala existente
- `typing` - Indicador de escritura
- `messageReceived` - Recibir mensaje
- `chatStarted` - Chat iniciado
- `disconnect` - Desconexión

### Uso

**Para pacientes**:
```typescript
// Iniciar chat desde /dashboard/patient/chat
const { startChat, sendMessage, messages } = useChatContext();

startChat("Hola, necesito ayuda con mi turno");
sendMessage("¿Puede ayudarme?");
```

**Para admin/recepcionista**:
```typescript
// Unirse a sala existente desde /dashboard/admin/chat
const { joinRoom, sendMessage } = useChatContext();

joinRoom(roomId, true); // true indica que es agente
sendMessage("¿En qué puedo ayudarte?");
```

---

## 📊 Formularios y Validación

### React Hook Form + Zod

Todos los formularios utilizan **React Hook Form** para gestión de estado y **Zod** para validación de esquemas.

**Ejemplo - Formulario de Registro**:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
  firstName: z.string().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  phone: z.string().min(10, "Teléfono inválido"),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female', 'other']),
});

const form = useForm({
  resolver: zodResolver(registerSchema),
  defaultValues: {
    firstName: "",
    lastName: "",
    email: "",
    // ...
  }
});
```

### Validaciones Comunes

- Email válido
- Contraseña mínimo 8 caracteres
- Teléfono con formato correcto
- Fechas válidas
- Campos requeridos
- Longitudes mínimas/máximas

---

## 🎨 Diseño y Estilos

### Tailwind CSS

Todos los estilos se manejan con **Tailwind CSS 4**:

```tsx
<div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg shadow-lg">
  <h1 className="text-3xl font-bold text-white">MediConnect</h1>
</div>
```

### Tema Claro/Oscuro

Implementado con **next-themes**:

```tsx
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();

<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  Toggle Theme
</Button>
```

### Responsive Design

Todas las páginas son completamente responsive:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards adaptativos */}
</div>
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 18+
- Backend de MediConnect ejecutándose

### 1. Instalación de Dependencias

```bash
npm install
```

### 2. Variables de Entorno

Crear archivo `.env.local` en la raíz:

```env
# URL del backend
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# WebSocket URL (opcional, si difiere del API)
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

### 4. Build para Producción

```bash
npm run build
npm run start
```

---

## 📚 Scripts Disponibles

```json
{
  "dev": "next dev --turbopack",           // Desarrollo con Turbopack
  "build": "next build --turbopack",       // Build de producción
  "start": "next start",                   // Iniciar servidor de producción
  "lint": "eslint"                         // Linting del código
}
```

---

## 🔄 Flujos de Usuario Principales

### Flujo de Reserva de Turno (Paciente)

```
1. Login en /login
2. Navegar a /dashboard/patient/appointments/new
3. Seleccionar médico del dropdown
4. Elegir fecha en calendario (muestra disponibilidad)
5. Seleccionar horario disponible
6. Elegir tipo: presencial/online
7. Escribir motivo de consulta
8. Confirmar → POST a /api/appointments
9. Redirige a /dashboard/patient/appointments
10. Ver turno en lista de próximos turnos
```

### Flujo de Gestión de Disponibilidad (Doctor)

```
1. Login como doctor
2. Navegar a /dashboard/doctor/availability
3. Configurar horarios por día de la semana:
   - Lunes: 09:00 - 17:00
   - Martes: 14:00 - 20:00
   - etc.
4. Definir duración de slots (ej: 30 minutos)
5. Guardar → POST a /api/appointments/availability
6. Sistema calcula slots automáticamente
```

### Flujo de Creación de Historial Médico (Doctor)

```
1. Completar cita con paciente
2. Navegar a /dashboard/doctor/records/new
3. Llenar formulario:
   - Seleccionar paciente
   - Motivo de consulta
   - Diagnóstico
   - Tratamiento
   - Signos vitales
   - Medicamentos
   - Notas
4. Cargar archivos (opcional):
   - Estudios de laboratorio
   - Recetas
   - Imágenes radiológicas
5. Guardar → POST a /api/medical-records
```

### Flujo de Chat (Paciente)

```
1. Navegar a /dashboard/patient/chat
2. Escribir mensaje inicial
3. Click en "Iniciar Chat"
4. WebSocket se conecta
5. Se crea sala con ID único
6. Mensajes en tiempo real
7. Recepcionista ve chat en /dashboard/admin/chat
8. Conversación en vivo hasta resolución
```

---

## 📡 Integración con API

### Cliente HTTP (Axios)

Configuración en `/lib/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Endpoints Utilizados

**Autenticación**:
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`

**Turnos**:
- `GET /appointments`
- `GET /appointments/upcoming`
- `GET /appointments/past`
- `POST /appointments`
- `GET /appointments/:id`

**Usuarios**:
- `GET /users/doctors`
- `GET /users/patients`
- `GET /users/:id`
- `PATCH /users/me`

**Disponibilidad**:
- `GET /appointments/availability/slots/available`
- `POST /appointments/availability`

**Historiales**:
- `GET /medical-records/my-records`
- `POST /medical-records`

**Estadísticas**:
- `GET /statistics/patient/me`
- `GET /statistics/doctor/me`
- `GET /statistics/dashboard`

**Chat**:
- `GET /chats/active`
- `POST /chats/startChat`

---

## 🎯 Características Avanzadas

### Notificaciones con Sonner

```typescript
import { toast } from 'sonner';

toast.success('Turno reservado exitosamente');
toast.error('Error al reservar turno');
toast.info('Tu turno está próximo');
```

### Gráficos con Recharts

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

<LineChart width={500} height={300} data={appointmentsData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="appointments" stroke="#8884d8" />
</LineChart>
```

### Calendario Interactivo

```typescript
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';

const [date, setDate] = useState<Date | undefined>(new Date());

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  disabled={(date) => date < new Date()}
/>
```

---

## 🛡️ Mejores Prácticas

- ✅ Validación de formularios con React Hook Form + Zod
- ✅ Tipado estático con TypeScript
- ✅ Componentes reutilizables
- ✅ Context API para estado global
- ✅ Protección de rutas por rol
- ✅ Manejo de errores centralizado
- ✅ Responsive design mobile-first
- ✅ Accesibilidad (a11y)
- ✅ SEO optimizado con Next.js
- ✅ Code splitting automático

---

## 🐛 Troubleshooting

### Error: API connection failed
```bash
# Verificar que el backend esté ejecutándose
curl http://localhost:3000/api/health

# Verificar NEXT_PUBLIC_API_URL en .env.local
```

### Error: WebSocket connection failed
```bash
# Verificar que Socket.io esté habilitado en backend
# Verificar CORS en backend incluya frontend URL
```

### Error: Cannot read properties of undefined
```bash
# Verificar que usuario esté autenticado
# Verificar que token sea válido
```

---

## 📞 Contacto y Soporte

Para preguntas o problemas:
- Email: frontend@mediconnect.com
- GitHub Issues: [Reportar problema](https://github.com/tu-usuario/MediConnect/issues)

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Desarrollado con ❤️ usando Next.js + React**
