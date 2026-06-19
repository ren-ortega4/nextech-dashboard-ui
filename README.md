# NexTech Dashboard UI

Frontend del sistema de gestión de facturas de **NexTech / RS Tech Limitada**. Aplicación web SPA (Single Page Application) construida con React 18 y Vite, que consume la API REST del backend Spring Boot.

---

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19+ | Librería UI principal |
| Vite | 8+ | Bundler y servidor de desarrollo |
| React Router v7 | 7+ | Navegación SPA con rutas protegidas |
| TanStack Query v5 | 5+ | Fetching, caché y sincronización de datos |
| Zustand v5 | 5+ | Estado global (auth, selección bulk, toasts) |
| Axios | 1+ | Cliente HTTP con interceptor JWT automático |

---

## Requisitos previos

- **Node.js** >= 18
- **npm** >= 9
- El backend **nextech-dashboard-api** corriendo en `http://localhost:8080`

---

## Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone https://github.com/amateurDUOC/NexTech.git
cd NexTech

# 2. Ir al directorio del frontend
cd nextech-dashboard-ui

# 3. Instalar dependencias
npm install

# 4. Crear archivo de variables de entorno
cp .env.example .env.local

# 5. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: **http://localhost:5173**

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
VITE_API_URL=http://localhost:8080
```

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend Spring Boot | `http://localhost:8080` |

---

## Estructura del proyecto

```
nextech-dashboard-ui/
├── public/                  # Archivos estáticos
├── src/
│   ├── api.js               # Instancia Axios centralizada + todos los endpoints
│   ├── store.js             # Estado global con Zustand (auth, selección, toasts)
│   ├── App.jsx              # Definición de rutas con PrivateRoute
│   ├── main.jsx             # Entry point — monta React + QueryClientProvider
│   ├── index.css            # Estilos globales
│   ├── pages/
│   │   ├── LoginPage.jsx        # Formulario de autenticación
│   │   ├── InvoicesPage.jsx     # Lista de facturas con filtros, stats y bulk actions
│   │   └── InvoiceDetail.jsx    # Detalle de factura, historial y documentos de retiro
│   └── components/
│       ├── DashboardLayout.jsx  # Sidebar y layout general
│       └── Toast.jsx            # Notificaciones temporales (success / error)
├── .env.example             # Plantilla de variables de entorno
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## Funcionalidades

### Autenticacion
- Login con email y contrasena
- Token JWT guardado en `localStorage`
- Interceptor Axios inyecta el token en cada request automaticamente
- Redireccion automatica a `/login` cuando el servidor retorna `401`
- Rutas protegidas con `PrivateRoute` — redirige si no hay sesion activa

### Lista de Facturas (`/facturas`)
- **Stats cards**: Total, Pendientes, Pagadas, Vencidas, En Revision, Monto Pendiente (CLP)
- **Busqueda** en tiempo real por cliente, empresa, N° factura o RUT
- **Filtros** por estado NIT y por mes
- **Tabla paginada** de 20 registros por pagina con skeleton loading
- **Bulk actions**: seleccionar multiples facturas y cambiar estado en masa

### Detalle de Factura (`/facturas/:id`)
- Datos completos del cliente (nombre, empresa, RUT, giro, direccion, email, telefono)
- Informacion de la factura (numero, fecha, vencimiento, neto, IVA 19%, total)
- Tabla de productos/servicios con cantidad, precio unitario y total
- **Cambiar estado** individual (pendiente / pagada / vencida / revision / anulada)
- **Marcar como entregado**
- **Historial** cronologico de cambios con actor y timestamp
- **Documentos de retiro**: zona drag & drop para subir PDF, JPG, PNG o WebP (max 10 MB)

---

## Scripts disponibles

```bash
npm run dev       # Inicia servidor de desarrollo en http://localhost:5173
npm run build     # Genera build de produccion en /dist
npm run preview   # Previsualiza el build de produccion localmente
npm run lint      # Ejecuta ESLint sobre el codigo fuente
```

---

## Conexion con el Backend

Todos los llamados a la API estan centralizados en `src/api.js`. El cliente Axios usa la variable de entorno `VITE_API_URL` como base URL.

### Endpoints utilizados

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Autenticacion |
| `POST` | `/api/v1/auth/register` | Registro de usuario |
| `GET` | `/api/v1/facturas/stats` | Stats del dashboard |
| `GET` | `/api/v1/facturas` | Listado paginado con filtros |
| `GET` | `/api/v1/facturas/:id` | Detalle de factura |
| `PATCH` | `/api/v1/facturas/:id` | Actualizar estado o entregado |
| `PATCH` | `/api/v1/facturas/bulk` | Actualizacion masiva de estado |
| `POST` | `/api/v1/facturas/:id/retiro` | Subir documento de retiro |
| `DELETE` | `/api/v1/facturas/:id/retiro/:fileId` | Eliminar documento |
| `POST` | `/api/v1/sync/full` | Disparar sync completo con WooCommerce |
| `POST` | `/api/v1/sync/incremental` | Disparar sync incremental |

---

## Backend relacionado

El backend que expone esta API es **nextech-dashboard-api** — Spring Boot 3.3.5 + Java 17 + PostgreSQL (Neon).

---

## Estructura del equipo

| Nombre | Rol |
|---|---|
| Alex Caica Zamora | Scrum Master / Development Team |
| Renato Ortega Ramos | Development Team |
| Ángel Prado Correa | Development Team |
| Manuel Reyes Bustos | Product Owner |

---

## Tablero Kanban

https://caica-ortega-prado.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog
