# MediConnect 🏥

**Sistema Integral de Gestión Médica**

MediConnect es una plataforma web completa para la gestión de clínicas médicas que facilita la administración de citas, historiales médicos, pagos y comunicación en tiempo real entre pacientes, doctores y personal administrativo.

---

## 📋 Descripción General

Este proyecto está diseñado para digitalizar y optimizar la gestión de una clínica médica, proporcionando herramientas tanto para el personal médico como para los pacientes. La aplicación permite:

- 📅 **Gestión de Turnos**: Reserva, confirmación y seguimiento de citas médicas
- 👥 **Administración de Usuarios**: Pacientes, doctores, recepcionistas y administradores
- 📊 **Historiales Médicos**: Registro completo de consultas, diagnósticos y tratamientos
- 💳 **Sistema de Pagos**: Gestión de facturación y múltiples métodos de pago
- 💬 **Chat en Tiempo Real**: Comunicación instantánea con soporte
- 📈 **Estadísticas y Reportes**: Análisis de rendimiento y ocupación de la clínica

---

## 🏗️ Arquitectura del Proyecto

El proyecto está dividido en dos aplicaciones independientes:

```
MediConnect/
├── back/          # Backend API REST (NestJS + MongoDB)
├── front/         # Frontend Web (Next.js + React)
└── README.md      # Este archivo
```

### Backend (API REST)
- **Framework**: NestJS 11 con TypeScript
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT + Passport.js
- **Comunicación en tiempo real**: Socket.io
- **Servicios externos**: Cloudinary (almacenamiento), SendGrid (emails)

### Frontend (Aplicación Web)
- **Framework**: Next.js 15 con App Router
- **UI**: React 19 + Tailwind CSS + shadcn/ui
- **Estado Global**: Context API
- **Comunicación**: Axios + Socket.io Client
- **Formularios**: React Hook Form + Zod

---

## 🚀 Características Principales

### Para Pacientes
- ✅ Registro y autenticación segura
- ✅ Reserva de turnos con disponibilidad en tiempo real
- ✅ Visualización de historial médico
- ✅ Acceso a resultados de estudios y recetas
- ✅ Chat de soporte con recepción
- ✅ Gestión de perfil personal

### Para Doctores
- ✅ Panel de control con agenda diaria
- ✅ Gestión de disponibilidad horaria
- ✅ Creación y edición de historiales médicos
- ✅ Listado de pacientes atendidos
- ✅ Carga de documentos médicos (estudios, recetas)
- ✅ Estadísticas de rendimiento

### Para Administradores
- ✅ Dashboard con métricas generales
- ✅ Gestión completa de usuarios (pacientes, doctores, staff)
- ✅ Control de todas las citas médicas
- ✅ Sistema de pagos y facturación
- ✅ Centro de soporte por chat
- ✅ Reportes y estadísticas avanzadas

---

## 🛠️ Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| NestJS | 11.0.1 | Framework web modular |
| MongoDB | 8.19.1 | Base de datos NoSQL |
| Mongoose | 8.19.1 | ODM para MongoDB |
| JWT | 11.0.1 | Autenticación segura |
| Socket.io | 4.8.1 | WebSockets para chat |
| Cloudinary | 1.41.3 | Almacenamiento de archivos |
| SendGrid | 8.1.6 | Envío de emails |
| Bcrypt | 6.0.0 | Hash de contraseñas |

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Next.js | 15.5.5 | Framework React |
| React | 19.1.0 | Librería UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Estilos CSS |
| shadcn/ui | Latest | Componentes UI |
| Axios | 1.12.2 | Cliente HTTP |
| Socket.io Client | 4.8.1 | Cliente WebSocket |
| React Hook Form | 7.65.0 | Gestión de formularios |
| Zod | 4.1.12 | Validación de esquemas |

---

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm/yarn
- MongoDB 6+ (local o MongoDB Atlas)
- Cuenta de Cloudinary (para almacenamiento de archivos)
- Cuenta de SendGrid (para envío de emails)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/MediConnect.git
cd MediConnect
```

### 2. Configurar Backend
```bash
cd back
npm install
```

Crear archivo `.env` en `/back`:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/mediconnect

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRATION=7d

# SendGrid
SENDGRID_API_KEY=tu_api_key_de_sendgrid
SENDGRID_FROM_EMAIL=noreply@mediconnect.com
SENDGRID_FROM_NAME=MediConnect

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:3001

# Puerto
PORT=3000

# Credenciales de Admin (opcional - para seed)
ADMIN_EMAIL=admin@mediconnect.com
ADMIN_PASSWORD=Admin123!
```

Ejecutar el seed (opcional - para datos de prueba):
```bash
npm run seed
```

Iniciar el servidor:
```bash
npm run start:dev
```

El backend estará disponible en `http://localhost:3000`

### 3. Configurar Frontend
```bash
cd front
npm install
```

Crear archivo `.env.local` en `/front`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Iniciar el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3001`

---

## 📚 Documentación Detallada

Para información más específica sobre cada parte del proyecto:

- **[Backend Documentation](./back/README.md)** - API REST, endpoints, schemas y servicios
- **[Frontend Documentation](./front/README.md)** - Páginas, componentes, rutas y contextos

---

## 🧪 Testing

### Backend
```bash
cd back

# Tests unitarios
npm run test

# Tests con coverage
npm run test:cov

# Tests e2e
npm run test:e2e
```

### Frontend
```bash
cd front

# Linting
npm run lint
```

---

## 🚢 Deployment

### Backend
```bash
cd back
npm run build
npm run start:prod
```

### Frontend
```bash
cd front
npm run build
npm run start
```

---

## 👥 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Paciente** | Ver/crear turnos propios, ver historial médico personal, chat con soporte |
| **Doctor** | Gestionar agenda, crear historiales médicos, ver pacientes asignados |
| **Recepcionista** | Gestionar turnos de todos, ver pacientes y doctores, chat soporte |
| **Administrador** | Acceso completo a todas las funcionalidades |

---

## 🔐 Seguridad

- Autenticación basada en JWT con expiración configurable
- Contraseñas hasheadas con bcrypt (10 salt rounds)
- Verificación de email obligatoria
- Control de acceso basado en roles (RBAC)
- Validación de datos con DTOs y Zod
- CORS configurado para frontend específico
- Tokens temporales para reset de contraseña

---

## 📞 Soporte

Para preguntas, sugerencias o reportar problemas:
- Email: soporte@mediconnect.com
- Issues: [GitHub Issues](https://github.com/tu-usuario/MediConnect/issues)

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

---

## 👨‍💻 Autor

Desarrollado con ❤️ para mejorar la gestión de clínicas médicas y la experiencia de pacientes y profesionales de la salud.

---

## 🗺️ Roadmap

- [ ] Integración con sistemas de obra social
- [ ] Videoconsultas integradas
- [ ] App móvil (React Native)
- [ ] Notificaciones push
- [ ] Integración con laboratorios externos
- [ ] Sistema de recordatorios automáticos por SMS
