# MediConnect - Backend API Completo

Sistema completo de gestión de turnos/citas para clínica médica desarrollado con NestJS, MongoDB y TypeScript.

## 🚀 Tecnologías

- **NestJS** - Framework backend
- **MongoDB** + **Mongoose** - Base de datos
- **Socket.io** - Chat en tiempo real
- **JWT** - Autenticación
- **SendGrid** - Envío de emails
- **Cloudinary** - Almacenamiento de archivos
- **Bcrypt** - Hash de contraseñas
- **TypeScript** - Lenguaje de programación

## 📋 Requisitos

- Node.js >= 18
- MongoDB Atlas (cuenta gratuita)
- SendGrid API Key (para emails)
- Cloudinary (para archivos)

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd mediconnect-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mediconnect?retryWrites=true&w=majority

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
JWT_EXPIRATION=7d

# SendGrid
SENDGRID_API_KEY=tu-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@mediconnect.com
SENDGRID_FROM_NAME=MediConnect

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Application
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Admin (para crear el primer admin)
ADMIN_EMAIL=admin@mediconnect.com
ADMIN_PASSWORD=Admin123!
```

### 4. Configurar servicios externos

#### MongoDB Atlas
1. Ir a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear una cuenta gratuita
3. Crear un cluster
4. Crear un usuario de base de datos
5. Obtener la connection string y reemplazarla en `MONGODB_URI`

#### SendGrid
1. Ir a [SendGrid](https://sendgrid.com/)
2. Crear una cuenta gratuita (100 emails/día gratis)
3. Verificar tu email de remitente
4. Crear una API Key
5. Copiar la API Key en `SENDGRID_API_KEY`

#### Cloudinary
1. Ir a [Cloudinary](https://cloudinary.com/)
2. Crear una cuenta gratuita
3. Ir al Dashboard
4. Copiar: Cloud Name, API Key, API Secret
5. Agregar las credenciales en las variables correspondientes

## ▶️ Ejecutar la aplicación

### Modo desarrollo

```bash
npm run start:dev
```

### Modo producción

```bash
npm run build
npm run start:prod
```

La API estará disponible en: `http://localhost:3000/api`

## 📚 Endpoints Disponibles

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Registrar nuevo paciente | ❌ |
| POST | `/login` | Iniciar sesión | ❌ |
| POST | `/verify-email` | Verificar email | ❌ |
| POST | `/forgot-password` | Solicitar reseteo de contraseña | ❌ |
| POST | `/reset-password` | Resetear contraseña | ❌ |
| GET | `/me` | Obtener perfil actual | ✅ |

### 👥 Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/` | Listar todos los usuarios | ✅ | Admin, Receptionist |
| GET | `/doctors` | Listar médicos activos | ❌ | - |
| GET | `/doctors/specialty/:specialty` | Médicos por especialidad | ❌ | - |
| GET | `/me` | Mi perfil | ✅ | Todos |
| GET | `/:id` | Obtener usuario por ID | ✅ | Todos |
| PATCH | `/me` | Actualizar mi perfil | ✅ | Todos |
| PATCH | `/:id` | Actualizar usuario | ✅ | Admin, Receptionist |
| DELETE | `/:id` | Eliminar usuario | ✅ | Admin |

### 🔑 Admin (`/api/admin`)

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/create-doctor` | Crear médico | ✅ | Admin |
| POST | `/create-receptionist` | Crear recepcionista | ✅ | Admin |
| POST | `/create-admin` | Crear admin | ✅ | Admin |
| GET | `/stats` | Estadísticas de usuarios | ✅ | Admin |

### 🗓️ Turnos/Citas (`/api/appointments`)

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/` | Crear turno | ✅ | Patient |
| GET | `/` | Listar turnos | ✅ | Todos |
| GET | `/upcoming` | Próximos turnos | ✅ | Patient |
| GET | `/past` | Historial de turnos | ✅ | Patient |
| GET | `/:id` | Obtener turno por ID | ✅ | Todos |
| PATCH | `/:id` | Modificar turno | ✅ | Patient, Admin, Receptionist |
| POST | `/:id/cancel` | Cancelar turno | ✅ | Todos (24hs para pacientes) |
| POST | `/:id/confirm` | Confirmar turno | ✅ | Doctor, Receptionist, Admin |
| POST | `/:id/complete` | Completar turno | ✅ | Doctor, Receptionist, Admin |

### 📅 Disponibilidad (`/api/appointments/availability`)

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/` | Crear disponibilidad | ✅ | Doctor |
| GET | `/doctor/:doctorId` | Ver disponibilidad de médico | ❌ | - |
| GET | `/my-schedule` | Mi horario de atención | ✅ | Doctor |
| GET | `/slots/available` | Slots disponibles | ❌ | - |
| PATCH | `/:id` | Actualizar disponibilidad | ✅ | Doctor, Admin |
| DELETE | `/:id` | Eliminar disponibilidad | ✅ | Doctor, Admin |

### 📋 Historial Clínico (`/api/medical-records`)

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/` | Crear registro médico | ✅ | Doctor, Admin |
| GET | `/` | Listar registros | ✅ | Todos |
| GET | `/patient/:patientId` | Historial de paciente | ✅ | Doctor, Receptionist, Admin |
| GET | `/my-records` | Mis registros médicos | ✅ | Patient |
| GET | `/:id` | Obtener registro por ID | ✅ | Todos |
| PATCH | `/:id` | Actualizar registro | ✅ | Doctor, Admin |
| POST | `/:id/upload` | Subir archivo | ✅ | Doctor, Admin |
| POST | `/:id/upload-multiple` | Subir múltiples archivos | ✅ | Doctor, Admin |
| DELETE | `/:id/attachments/:index` | Eliminar archivo | ✅ | Doctor, Admin |
| DELETE | `/:id` | Eliminar registro | ✅ | Admin |

### 💬 Chat en Vivo (`/api/chats`)

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/` | Listar chats | ✅ | Receptionist, Admin |
| GET | `/active` | Chats activos | ✅ | Receptionist, Admin |
| GET | `/my-chats` | Mi historial de chat | ✅ | Patient |
| GET | `/:roomId` | Obtener chat por ID | ✅ | Todos |
| PATCH | `/:roomId/status` | Actualizar estado | ✅ | Receptionist, Admin |
| POST | `/:roomId/assign/:agentId` | Asignar agente | ✅ | Receptionist, Admin |

#### WebSocket Events (Socket.io - Namespace: `/chat`)

| Event | Descripción | Datos |
|-------|-------------|-------|
| `startChat` | Iniciar nuevo chat | `{ guestName?, guestEmail?, initialMessage }` |
| `joinRoom` | Unirse a sala | `{ roomId, userId?, isAgent? }` |
| `sendMessage` | Enviar mensaje | `{ roomId, content }` |
| `assignAgent` | Asignar agente | `{ roomId, agentId }` |
| `typing` | Usuario escribiendo | `{ roomId, isTyping }` |
| `markAsRead` | Marcar como leído | `{ roomId }` |

### 💰 Pagos (`/api/payments`)

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/` | Registrar pago | ✅ | Receptionist, Admin |
| GET | `/` | Listar pagos | ✅ | Todos |
| GET | `/my-payments` | Mis pagos | ✅ | Patient |
| GET | `/appointment/:appointmentId` | Pago por turno | ✅ | Todos |
| GET | `/revenue` | Total recaudado | ✅ | Admin |
| GET | `/stats/by-method` | Estadísticas por método | ✅ | Admin |
| GET | `/:id` | Obtener pago por ID | ✅ | Todos |
| PATCH | `/:id` | Actualizar pago | ✅ | Receptionist, Admin |
| POST | `/:id/refund` | Reembolsar pago | ✅ | Admin |
| DELETE | `/:id` | Eliminar pago | ✅ | Admin |

### 📊 Estadísticas (`/api/statistics`)

| Método | Endpoint | Descripción | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/dashboard` | Dashboard general | ✅ | Admin, Receptionist |
| GET | `/appointments/by-doctor` | Turnos por médico | ✅ | Admin, Receptionist |
| GET | `/appointments/by-month/:year` | Turnos por mes | ✅ | Admin, Receptionist |
| GET | `/patients/frequent` | Pacientes frecuentes | ✅ | Admin, Receptionist |
| GET | `/revenue/by-month/:year` | Ingresos por mes | ✅ | Admin |
| GET | `/doctor/:doctorId` | Estadísticas de médico | ✅ | Doctor, Admin |
| GET | `/doctor/me` | Mis estadísticas (médico) | ✅ | Doctor |
| GET | `/patient/:patientId` | Estadísticas de paciente | ✅ | Patient, Doctor, Admin |
| GET | `/patient/me` | Mis estadísticas (paciente) | ✅ | Patient |

## 🎭 Roles de Usuario

- **PATIENT** - Paciente (rol por defecto al registrarse)
- **DOCTOR** - Médico (creado por admin)
- **RECEPTIONIST** - Recepcionista (creado por admin)
- **ADMIN** - Administrador (creado automáticamente al iniciar)

## 📧 Emails Automáticos

El sistema envía emails en los siguientes casos:

1. **Verificación de cuenta** - Al registrarse un nuevo usuario
2. **Bienvenida** - Después de verificar el email
3. **Recuperación de contraseña** - Al solicitar reset de password

## 🔒 Seguridad

- Las contraseñas se hashean con **bcrypt**
- Autenticación con **JWT**
- Validación de datos con **class-validator**
- Tokens de verificación y reseteo con expiración
- CORS configurado para el frontend
- Permisos basados en roles

## 📝 Reglas de Contraseña

Las contraseñas deben cumplir:
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial (@$!%*?&)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📁 Estructura del Proyecto

```
src/
├── auth/                    # Módulo de autenticación
│   ├── decorators/         # Decoradores personalizados
│   ├── dto/                # DTOs de auth
│   ├── guards/             # Guards (JWT, Roles)
│   ├── strategies/         # Estrategias de Passport
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── email.service.ts
├── users/                   # Módulo de usuarios
│   ├── dto/
│   ├── schemas/
│   ├── users.service.ts
│   ├── users.controller.ts
│   ├── admin.controller.ts
│   └── users.module.ts
├── appointments/            # Módulo de turnos
│   ├── dto/
│   ├── schemas/
│   ├── appointments.service.ts
│   ├── availability.service.ts
│   ├── appointments.controller.ts
│   └── appointments.module.ts
├── medical-records/         # Módulo de historial clínico
│   ├── dto/
│   ├── schemas/
│   ├── medical-records.service.ts
│   ├── medical-records.controller.ts
│   └── medical-records.module.ts
├── chat/                    # Módulo de chat en vivo
│   ├── dto/
│   ├── schemas/
│   ├── chat.service.ts
│   ├── chat.gateway.ts
│   ├── chat.controller.ts
│   └── chat.module.ts
├── payments/                # Módulo de pagos
│   ├── dto/
│   ├── schemas/
│   ├── payments.service.ts
│   ├── payments.controller.ts
│   └── payments.module.ts
├── statistics/              # Módulo de estadísticas
│   ├── statistics.service.ts
│   ├── statistics.controller.ts
│   └── statistics.module.ts
├── config/                  # Configuración global
│   ├── cloudinary.config.ts
│   └── cloudinary.service.ts
├── seed/                    # Seed de datos iniciales
│   ├── seed.service.ts
│   └── seed.module.ts
├── app.module.ts
└── main.ts
```

## ✨ Funcionalidades Implementadas

### ✅ FASE 1 - MVP Core
- Sistema completo de autenticación (JWT)
- Registro y login
- Verificación de email
- Recuperación de contraseña
- Gestión de usuarios (CRUD)
- 4 roles: Patient, Doctor, Receptionist, Admin
- Panel de administración
- Usuario admin inicial (seed)

### ✅ FASE 2 - Sistema de Turnos
- CRUD de turnos completo
- Estados: pending, confirmed, completed, cancelled, no_show
- Sistema de disponibilidad médica
- Slots configurables (15-120 minutos)
- Prevención de dobles reservas
- Cancelación con restricción de 24hs para pacientes
- Filtros avanzados (por médico, paciente, estado, fechas)

### ✅ FASE 3 - Historial Clínico
- Registros médicos detallados
- Signos vitales
- Diagnósticos y tratamientos
- Medicaciones prescritas
- Upload de archivos (Cloudinary)
- Múltiples tipos: imágenes, PDFs, estudios, recetas
- Vinculación con turnos
- Registros confidenciales
- Permisos granulares por rol

### ✅ FASE 4 - Features Avanzados

#### 💬 Chat en Vivo (Socket.io)
- WebSocket en tiempo real
- Sala única por conversación
- Chat para usuarios logueados y guests
- Asignación de agentes (recepcionistas)
- Historial de conversaciones
- Estados: active, resolved, closed
- Indicadores de escritura
- Mensajes leídos/no leídos

#### 💰 Sistema de Pagos
- Registro de pagos por turno
- Métodos: efectivo, débito, crédito, transferencia, obra social
- Número de recibo automático
- Estados: pending, completed, failed, refunded
- Reembolsos con razón
- Estadísticas de ingresos

#### 📊 Dashboard de Estadísticas
- Dashboard general (admin/recepcionista)
- Total de usuarios, turnos, ingresos
- Turnos por médico
- Turnos por mes
- Pacientes frecuentes
- Ingresos por mes
- Estadísticas personales (médicos y pacientes)
- Filtros por fecha

## 🐛 Troubleshooting

### Error de conexión a MongoDB
- Verificar que la IP esté en la whitelist de MongoDB Atlas
- Verificar usuario y contraseña en la connection string
- Verificar que el cluster esté activo

### Emails no se envían
- Verificar API Key de SendGrid
- Verificar que el email remitente esté verificado en SendGrid
- Verificar límite de envío (100/día en plan gratuito)

### Error al subir archivos
- Verificar credenciales de Cloudinary
- Verificar límite de tamaño (10MB por archivo)
- Verificar formatos permitidos

### WebSocket no conecta
- Verificar que el puerto 3000 esté abierto
- Verificar CORS configurado correctamente
- Verificar FRONTEND_URL en .env

## 📊 Métricas del Proyecto

- **Líneas de código**: ~8,000+
- **Endpoints**: 80+
- **Schemas**: 7
- **Módulos**: 9
- **Servicios**: 12
- **Controllers**: 10
- **Guards**: 2
- **Decorators**: 2

## 🚀 Próximos pasos (Futuras mejoras)

- [ ] Recordatorios automáticos por WhatsApp (Twilio/UltraMsg)
- [ ] Notificaciones push en tiempo real
- [ ] Exportar reportes a PDF/Excel
- [ ] Sistema de calificaciones/reviews
- [ ] Integración con calendar (Google Calendar, Outlook)
- [ ] Videollamadas integradas (Zoom/Jitsi)
- [ ] App móvil (React Native)

## 📄 Licencia

MIT

## 👨‍💻 Autor

Tu nombre - Portfolio Project

---

## 🎉 El backend está 100% funcional y listo para conectar con el frontend!

**Próximo paso recomendado**: Comenzar con el desarrollo del frontend en Next.js