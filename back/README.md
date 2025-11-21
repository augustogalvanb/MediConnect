# MediConnect - Backend API 🚀

API REST completa para sistema de gestión de clínicas médicas desarrollada con **NestJS**, **MongoDB** y **TypeScript**.

---

## 📋 Descripción

El backend de MediConnect es una API robusta y escalable que proporciona todos los servicios necesarios para la gestión integral de una clínica médica, incluyendo:

- Autenticación y autorización con JWT
- Gestión de usuarios multi-rol (pacientes, doctores, recepcionistas, administradores)
- Sistema completo de citas médicas con disponibilidad dinámica
- Historiales médicos con carga de documentos
- Sistema de pagos y facturación
- Chat en tiempo real con WebSockets
- Estadísticas y reportes administrativos

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
NestJS 11.0.1 (Framework)
├── MongoDB 8.19.1 (Base de datos)
├── Mongoose 8.19.1 (ODM)
├── JWT + Passport.js (Autenticación)
├── Socket.io 4.8.1 (WebSockets)
├── Bcrypt 6.0.0 (Hash de contraseñas)
├── Cloudinary 1.41.3 (Almacenamiento de archivos)
├── SendGrid 8.1.6 (Envío de emails)
└── TypeScript 5.7.3
```

### Estructura de Módulos

```
src/
├── app.module.ts                    # Módulo raíz
├── main.ts                          # Punto de entrada
│
├── auth/                            # Autenticación y autorización
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── email.service.ts
│   ├── strategies/jwt.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── get-user.decorator.ts
│   │   └── roles.decorator.ts
│   └── dto/auth.dto.ts
│
├── users/                           # Gestión de usuarios
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   ├── admin.controller.ts
│   ├── schemas/user.schema.ts
│   └── dto/create-user.dto.ts
│
├── appointments/                    # Citas y disponibilidad
│   ├── appointments.module.ts
│   ├── appointments.service.ts
│   ├── availability.service.ts
│   ├── appointments.controller.ts
│   ├── schemas/
│   │   ├── appointment.schema.ts
│   │   └── availability.schema.ts
│   └── dto/
│       ├── appointment.dto.ts
│       └── availability.dto.ts
│
├── medical-records/                 # Historiales médicos
│   ├── medical-records.module.ts
│   ├── medical-records.service.ts
│   ├── medical-records.controller.ts
│   ├── schemas/medical-record.schema.ts
│   └── dto/medical-record.dto.ts
│
├── chat/                            # Chat en tiempo real
│   ├── chat.module.ts
│   ├── chat.service.ts
│   ├── chat.gateway.ts
│   ├── chat.controller.ts
│   ├── schemas/chat.schema.ts
│   └── dto/chat.dto.ts
│
├── payments/                        # Sistema de pagos
│   ├── payments.module.ts
│   ├── payments.service.ts
│   ├── payments.controller.ts
│   ├── schemas/payment.schema.ts
│   └── dto/payment.dto.ts
│
├── statistics/                      # Reportes y estadísticas
│   ├── statistics.module.ts
│   ├── statistics.service.ts
│   └── statistics.controller.ts
│
├── config/                          # Configuraciones
│   ├── cloudinary.service.ts
│   └── cloudinary.config.ts
│
├── scripts/                         # Scripts de utilidades
│   └── seed.ts
│
└── seed/                            # Datos iniciales
    ├── seed.module.ts
    └── seed.service.ts
```

---

## 🔐 Autenticación y Autorización

### Roles de Usuario

```typescript
enum UserRole {
  PATIENT = 'patient',           // Paciente
  DOCTOR = 'doctor',             // Médico
  RECEPTIONIST = 'receptionist', // Recepcionista
  ADMIN = 'admin'                // Administrador
}
```

### Endpoints de Autenticación

| Método | Endpoint | Descripción | Público |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Registrar nuevo usuario | ✅ |
| POST | `/api/auth/login` | Iniciar sesión | ✅ |
| POST | `/api/auth/verify-email` | Verificar email | ✅ |
| POST | `/api/auth/forgot-password` | Solicitar reset de contraseña | ✅ |
| POST | `/api/auth/reset-password` | Resetear contraseña | ✅ |
| GET | `/api/auth/me` | Obtener perfil del usuario autenticado | 🔒 |

### Seguridad Implementada

- ✅ JWT con expiración configurable (default: 7 días)
- ✅ Contraseñas hasheadas con bcrypt (10 salt rounds)
- ✅ Tokens de verificación de email (válidos 24h)
- ✅ Tokens de reset de contraseña (válidos 1h)
- ✅ Guards para protección de rutas
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Validación global con DTOs

---

## 👥 Módulo de Usuarios

### Schema de Usuario

```typescript
interface User {
  // Datos personales
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';

  // Ubicación
  address: string;
  city: string;
  province: string;
  postalCode: string;
  dni: string;

  // Sistema
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin: Date;
  avatar: string;

  // Solo para médicos
  specialty?: string;
  licenseNumber?: string;
}
```

### Endpoints de Usuarios

| Método | Endpoint | Descripción | Roles Permitidos |
|--------|----------|-------------|------------------|
| GET | `/api/users` | Listar todos los usuarios | ADMIN, RECEPTIONIST |
| GET | `/api/users/doctors` | Listar médicos | Todos |
| GET | `/api/users/doctors/specialty/:specialty` | Médicos por especialidad | Todos |
| GET | `/api/users/me` | Perfil propio | Autenticado |
| GET | `/api/users/:id` | Usuario específico | Según permisos |
| PATCH | `/api/users/me` | Actualizar perfil propio | Autenticado |
| PATCH | `/api/users/:id` | Actualizar usuario | ADMIN |
| DELETE | `/api/users/:id` | Eliminar usuario | ADMIN |

---

## 📅 Módulo de Citas

### Estados de Cita

```typescript
enum AppointmentStatus {
  PENDING = 'pending',       // Pendiente de confirmación
  CONFIRMED = 'confirmed',   // Confirmada
  COMPLETED = 'completed',   // Completada
  CANCELLED = 'cancelled',   // Cancelada
  NO_SHOW = 'no_show'       // No asistió
}

enum AppointmentType {
  IN_PERSON = 'in_person',   // Presencial
  ONLINE = 'online'          // Virtual
}
```

### Schema de Cita

```typescript
interface Appointment {
  patient: ObjectId;           // Referencia al paciente
  doctor: ObjectId;            // Referencia al médico
  date: Date;                  // Fecha de la cita
  startTime: string;           // Hora de inicio (ej: "09:00")
  endTime: string;             // Hora de fin (ej: "09:30")
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string;              // Motivo de consulta
  notes?: string;              // Notas adicionales
  diagnosis?: string;          // Diagnóstico

  // Tracking de cancelación
  cancelReason?: string;
  cancelledAt?: Date;
  cancelledBy?: ObjectId;

  // Tracking de confirmación
  confirmedAt?: Date;
  confirmedBy?: ObjectId;

  // Recordatorios
  reminderSent: boolean;
  reminderSentAt?: Date;
}
```

### Endpoints de Citas

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/api/appointments` | Crear cita | PATIENT, RECEPTIONIST, ADMIN |
| GET | `/api/appointments` | Listar citas | Según rol |
| GET | `/api/appointments/:id` | Detalle de cita | Según permisos |
| GET | `/api/appointments/upcoming` | Próximas citas | Autenticado |
| GET | `/api/appointments/past` | Citas pasadas | Autenticado |
| PATCH | `/api/appointments/:id` | Actualizar cita | DOCTOR, ADMIN |
| POST | `/api/appointments/:id/cancel` | Cancelar cita | Todos |
| POST | `/api/appointments/:id/confirm` | Confirmar cita | DOCTOR, RECEPTIONIST, ADMIN |
| POST | `/api/appointments/:id/complete` | Completar cita | DOCTOR |

### Disponibilidad de Médicos

```typescript
interface Availability {
  doctor: ObjectId;
  dayOfWeek: number;           // 0=Domingo, 1=Lunes, ..., 6=Sábado
  startTime: string;           // ej: "09:00"
  endTime: string;             // ej: "17:00"
  slotDuration: number;        // Duración en minutos (default: 30)
  effectiveFrom: Date;         // Fecha desde
  effectiveUntil?: Date;       // Fecha hasta (opcional)
  isActive: boolean;
}
```

### Endpoints de Disponibilidad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/appointments/availability` | Crear disponibilidad |
| GET | `/api/appointments/availability/doctor/:id` | Ver disponibilidad del doctor |
| GET | `/api/appointments/availability/my-schedule` | Mi agenda (doctor) |
| GET | `/api/appointments/availability/slots/available` | Slots libres |
| PATCH | `/api/appointments/availability/:id` | Actualizar disponibilidad |
| DELETE | `/api/appointments/availability/:id` | Eliminar disponibilidad |

---

## 📋 Módulo de Historiales Médicos

### Schema de Historial Médico

```typescript
interface MedicalRecord {
  patient: ObjectId;
  doctor: ObjectId;
  appointment?: ObjectId;

  // Información clínica
  consultationDate: Date;
  chiefComplaint: string;              // Motivo de consulta
  historyOfPresentIllness?: string;    // Historia de enfermedad actual
  physicalExamination?: string;        // Examen físico
  diagnosis?: string;                  // Diagnóstico
  treatment?: string;                  // Plan de tratamiento
  medications?: string;                // Medicamentos
  notes?: string;                      // Notas adicionales
  followUpDate?: Date;                 // Fecha de seguimiento

  // Signos vitales
  vitalSigns?: {
    bloodPressure?: string;            // ej: "120/80"
    heartRate?: number;                // bpm
    temperature?: number;              // °C
    weight?: number;                   // kg
    height?: number;                   // cm
    oxygenSaturation?: number;         // %
    respiratoryRate?: number;          // rpm
  };

  // Archivos adjuntos
  attachments: {
    url: string;
    publicId: string;
    type: FileType;
    filename: string;
    uploadedAt: Date;
  }[];

  isConfidential: boolean;
}

enum FileType {
  IMAGE = 'image',
  PDF = 'pdf',
  LAB_RESULT = 'lab_result',
  PRESCRIPTION = 'prescription',
  RADIOLOGY = 'radiology',
  OTHER = 'other'
}
```

### Endpoints de Historiales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/medical-records` | Crear registro médico |
| GET | `/api/medical-records` | Listar registros |
| GET | `/api/medical-records/:id` | Detalle de registro |
| GET | `/api/medical-records/patient/:id` | Registros de un paciente |
| GET | `/api/medical-records/my-records` | Mis registros médicos |
| PATCH | `/api/medical-records/:id` | Actualizar registro |
| POST | `/api/medical-records/:id/upload` | Subir archivo |
| POST | `/api/medical-records/:id/upload-multiple` | Subir múltiples archivos |
| DELETE | `/api/medical-records/:id/attachments/:index` | Eliminar archivo |
| DELETE | `/api/medical-records/:id` | Eliminar registro |

### Integración con Cloudinary

- Almacenamiento seguro de archivos médicos
- Máximo 10MB por archivo
- Hasta 10 archivos por registro
- Eliminación automática de archivos al borrar registro

---

## 💬 Módulo de Chat

### Schema de Chat

```typescript
interface Chat {
  user?: ObjectId;              // Usuario autenticado
  guestName?: string;           // Nombre si es invitado
  guestEmail?: string;          // Email si es invitado
  assignedAgent?: ObjectId;     // Agente asignado
  status: ChatStatus;
  roomId: string;               // ID único de sala
  lastMessageAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: ObjectId;

  messages: {
    sender?: ObjectId;
    senderType: MessageSender;
    content: string;
    timestamp: Date;
    isRead: boolean;
  }[];
}

enum ChatStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

enum MessageSender {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system'
}
```

### WebSocket Events

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `connection` | Cliente conectado | - |
| `startChat` | Iniciar chat | `{ message, guestName?, guestEmail? }` |
| `sendMessage` | Enviar mensaje | `{ roomId, content }` |
| `joinRoom` | Unirse a sala | `{ roomId, isAgent }` |
| `typing` | Usuario escribiendo | `{ roomId }` |
| `messageReceived` | Mensaje recibido | `Message` |
| `chatStarted` | Chat iniciado | `{ roomId, chat }` |
| `disconnect` | Cliente desconectado | - |

---

## 💳 Módulo de Pagos

### Schema de Pago

```typescript
interface Payment {
  patient: ObjectId;
  appointment: ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;

  // Seguro médico
  healthInsuranceName?: string;
  healthInsuranceNumber?: string;

  // Transacción
  transactionId?: string;
  receiptNumber?: string;
  notes?: string;
  processedBy?: ObjectId;
  paidAt?: Date;

  // Reembolso
  refundedAt?: Date;
  refundReason?: string;
}

enum PaymentMethod {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  TRANSFER = 'transfer',
  HEALTH_INSURANCE = 'health_insurance'
}

enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}
```

### Endpoints de Pagos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/payments` | Crear pago |
| GET | `/api/payments` | Listar pagos |
| GET | `/api/payments/:id` | Detalle de pago |
| GET | `/api/payments/my-payments` | Mis pagos |
| GET | `/api/payments/appointment/:id` | Pagos de una cita |
| GET | `/api/payments/revenue` | Ingresos totales |
| GET | `/api/payments/stats/by-method` | Estadísticas por método |
| PATCH | `/api/payments/:id` | Actualizar pago |
| POST | `/api/payments/:id/refund` | Reembolsar pago |
| DELETE | `/api/payments/:id` | Eliminar pago |

---

## 📊 Módulo de Estadísticas

### Endpoints de Reportes (Solo ADMIN)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/statistics/users` | Total usuarios por rol |
| GET | `/api/statistics/appointments` | Estadísticas de citas |
| GET | `/api/statistics/revenue` | Ingresos por período |
| GET | `/api/statistics/popular-doctors` | Doctores más solicitados |
| GET | `/api/statistics/payment-methods` | Métodos de pago más usados |

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 18+
- MongoDB 6+
- Cuenta de Cloudinary
- Cuenta de SendGrid

### 1. Instalación de Dependencias

```bash
npm install
```

### 2. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/mediconnect

# JWT
JWT_SECRET=tu_secreto_super_seguro_con_minimo_32_caracteres
JWT_EXPIRATION=7d

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@mediconnect.com
SENDGRID_FROM_NAME=MediConnect

# Cloudinary (Almacenamiento)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=tu_api_secret_aqui

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3001

# Puerto del servidor
PORT=3000

# Ambiente
NODE_ENV=development

# Credenciales de Admin (para seed)
ADMIN_EMAIL=admin@mediconnect.com
ADMIN_PASSWORD=Admin123!
```

### 3. Ejecutar Seed (Datos de Prueba)

```bash
npm run seed
```

Esto creará:
- Usuario administrador
- Algunos médicos con especialidades
- Pacientes de ejemplo
- Citas de prueba

### 4. Iniciar el Servidor

**Desarrollo:**
```bash
npm run start:dev
```

**Producción:**
```bash
npm run build
npm run start:prod
```

El servidor estará disponible en `http://localhost:3000`

---

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:cov

# Tests end-to-end
npm run test:e2e

# Tests en modo debug
npm run test:debug
```

---

## 📚 Scripts Disponibles

```json
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "format": "prettier --write \"src/**/*.ts\"",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "seed": "ts-node src/scripts/seed.ts"
}
```

---

## 📡 API Documentation

Una vez que el servidor esté ejecutándose, la documentación interactiva de Swagger estará disponible en:

```
http://localhost:3000/api/docs
```

(Nota: Si Swagger no está configurado, puedes agregarlo instalando `@nestjs/swagger`)

---

## 🔄 Flujos de Trabajo Principales

### Flujo de Autenticación
```
1. Usuario se registra → POST /api/auth/register
2. Recibe email de verificación
3. Verifica email → POST /api/auth/verify-email
4. Inicia sesión → POST /api/auth/login
5. Recibe JWT token
6. Usa token en header: Authorization: Bearer <token>
```

### Flujo de Cita Médica
```
1. Paciente busca médicos → GET /api/users/doctors
2. Consulta disponibilidad → GET /api/appointments/availability/slots/available
3. Crea cita → POST /api/appointments
4. Doctor confirma → POST /api/appointments/:id/confirm
5. Consulta realizada → POST /api/appointments/:id/complete
6. Se crea historial médico → POST /api/medical-records
7. Se registra pago → POST /api/payments
```

---

## 🛡️ Mejores Prácticas de Seguridad

- ✅ Nunca commitear archivo `.env`
- ✅ Usar contraseñas fuertes para JWT_SECRET
- ✅ Implementar rate limiting en producción
- ✅ Validar todos los inputs con DTOs
- ✅ Sanitizar datos antes de guardar en BD
- ✅ Usar HTTPS en producción
- ✅ Configurar CORS apropiadamente
- ✅ Implementar logs de auditoría

---

## 🐛 Troubleshooting

### Error: MongoDB connection failed
```bash
# Verificar que MongoDB esté ejecutándose
sudo systemctl status mongodb

# O si usas Docker
docker ps | grep mongo
```

### Error: JWT malformed
```bash
# Verificar que el token esté en el formato correcto
# Header: Authorization: Bearer <token>
```

### Error: Cloudinary upload failed
```bash
# Verificar credenciales de Cloudinary en .env
# Verificar tamaño del archivo (máx 10MB)
```

---

## 📞 Contacto y Soporte

Para preguntas o problemas:
- Email: dev@mediconnect.com
- GitHub Issues: [Reportar problema](https://github.com/tu-usuario/MediConnect/issues)

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Desarrollado con ❤️ usando NestJS**
