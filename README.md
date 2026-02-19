# Sistema de Tickets de Soporte IT - Clínica

Sistema completo de gestión de tickets para el equipo de soporte IT de la clínica. Permite a los usuarios reportar problemas con equipos (PC, impresoras, telefonía IP) y a los técnicos gestionar, asignar y resolver tickets.

## 🎯 Características

### Para Usuarios:
- ✅ Crear tickets de soporte
- ✅ Ver estado de tickets en tiempo real
- ✅ Seguimiento completo del proceso

### Para Técnicos IT:
- ✅ Dashboard con estadísticas
- ✅ Asignación de tickets
- ✅ Gestión de prioridades (Baja, Media, Alta)
- ✅ Cambio de estados (Pendiente, En Progreso, Resuelto)
- ✅ Sistema de comentarios
- ✅ Filtros avanzados

## 🚀 Instalación Rápida

### Opción 1: Demo (Sin instalación)

1. Abrir el archivo `sistema_tickets.html` en tu navegador
2. Usar credenciales de prueba:
   - **Usuario:** `usuario1` / Contraseña: `1234`
   - **Técnico:** `tecnico1` / Contraseña: `1234`

### Opción 2: Versión Producción (Con backend)

#### Requisitos Previos:
- Node.js v14 o superior
- npm o yarn

#### Pasos:

1. **Instalar dependencias:**
```bash
npm install
```

2. **Inicializar base de datos:**
```bash
# Ejecutar el script SQL
sqlite3 tickets.db < base_datos.sql
```

3. **Iniciar servidor:**
```bash
npm start
```

4. **Acceder a la aplicación:**
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
sistema-tickets-it/
├── sistema_tickets.html    # Frontend (versión demo)
├── server.js              # Backend API REST
├── base_datos.sql         # Esquema de base de datos
├── package.json           # Dependencias Node.js
├── DOCUMENTACION.md       # Documentación completa
└── README.md             # Este archivo
```

## 🔐 Seguridad

### IMPORTANTE para Producción:

1. **Cambiar SECRET_KEY** en `server.js`:
```javascript
const SECRET_KEY = 'tu_clave_super_segura_aqui';
```

2. **Usar HTTPS** obligatoriamente

3. **Configurar CORS** adecuadamente:
```javascript
app.use(cors({
    origin: 'https://tu-dominio.com'
}));
```

4. **Variables de entorno** (crear archivo `.env`):
```env
PORT=3000
SECRET_KEY=tu_clave_secreta
DATABASE_PATH=./tickets.db
```

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/registro` - Registrar usuario (solo técnicos)

### Tickets
- `GET /api/tickets` - Listar tickets (con filtros)
- `GET /api/tickets/:id` - Obtener ticket específico
- `POST /api/tickets` - Crear nuevo ticket
- `PUT /api/tickets/:id` - Actualizar ticket
- `POST /api/tickets/:id/asignar` - Asignar ticket

### Comentarios
- `POST /api/tickets/:id/comentarios` - Agregar comentario

### Estadísticas
- `GET /api/estadisticas` - Estadísticas generales
- `GET /api/estadisticas/tipos` - Estadísticas por tipo

## 🔧 Uso del Sistema

### Para Usuarios:

1. **Crear un ticket:**
   - Iniciar sesión
   - Ir a "Nuevo Ticket"
   - Completar el formulario
   - Enviar

2. **Seguimiento:**
   - Ver "Mis Tickets"
   - Click en cualquier ticket para ver detalles

### Para Técnicos:

1. **Asignar ticket:**
   - Ver tickets pendientes
   - Click en el ticket
   - "Asignarme este ticket"

2. **Gestionar ticket:**
   - Cambiar estado
   - Modificar prioridad
   - Agregar comentarios
   - Marcar como resuelto

## 🎨 Personalización

### Cambiar colores:
Editar variables CSS en `sistema_tickets.html`:

```css
:root {
    --accent-primary: #00d9ff;      /* Color principal */
    --accent-secondary: #ff006e;    /* Color secundario */
}
```

### Agregar tipos de equipo:
En el formulario de nuevo ticket, agregar opciones al select:

```html
<option value="NuevoTipo">Nuevo Tipo</option>
```

## 📈 Consultas SQL Útiles

### Tickets sin asignar:
```sql
SELECT * FROM tickets WHERE asignado_a IS NULL;
```

### Rendimiento por técnico:
```sql
SELECT 
    u.nombre,
    COUNT(t.id) as total_tickets,
    SUM(CASE WHEN t.estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos
FROM usuarios u
LEFT JOIN tickets t ON u.id = t.asignado_a
WHERE u.rol = 'tecnico'
GROUP BY u.id;
```

### Tiempo promedio de resolución:
```sql
SELECT 
    AVG((JULIANDAY(fecha_resolucion) - JULIANDAY(fecha_creacion)) * 24) as horas_promedio
FROM tickets
WHERE fecha_resolucion IS NOT NULL;
```

## 🐛 Troubleshooting

### Error: "Puerto ya en uso"
```bash
# Cambiar puerto en server.js o
PORT=3001 npm start
```

### Error: "Base de datos bloqueada"
```bash
# Cerrar todas las conexiones y reiniciar
rm tickets.db
sqlite3 tickets.db < base_datos.sql
```

### Resetear contraseñas
```sql
-- Resetear contraseña de admin (1234)
UPDATE usuarios 
SET password = '$2b$10$ejemplo_hash_bcrypt' 
WHERE username = 'admin';
```

## 📝 Logs

Los logs del servidor se muestran en consola:
```
✅ Conectado a la base de datos SQLite
🚀 Servidor corriendo en http://localhost:3000
```

## 🔄 Actualizaciones

### Backup antes de actualizar:
```bash
# Copiar base de datos
cp tickets.db tickets.db.backup

# Exportar datos
sqlite3 tickets.db .dump > backup_$(date +%Y%m%d).sql
```

## 👥 Usuarios de Prueba

Los siguientes usuarios están pre-creados en la base de datos:

**Usuarios:**
- usuario1 / 1234
- usuario2 / 1234

**Técnicos:**
- tecnico1 / 1234
- tecnico2 / 1234
- tecnico3 / 1234
- tecnico4 / 1234
- tecnico5 / 1234
- tecnico6 / 1234

## 📞 Soporte

Para problemas o sugerencias, contactar al administrador del sistema.

## 📄 Licencia

Uso interno - Clínica

---

**Desarrollado para el equipo de Soporte IT** 🚀
