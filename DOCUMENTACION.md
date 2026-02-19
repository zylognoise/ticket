# Sistema de Tickets de Soporte IT - Documentación

## 📋 Descripción General

Sistema web completo para gestión de tickets de soporte IT en clínica. Permite a los usuarios reportar problemas con equipos (PC, impresoras, telefonía IP) y a los técnicos gestionar, asignar y resolver los tickets.

## ✨ Características Principales

### Para Usuarios:
- ✅ Crear tickets de soporte para diferentes tipos de equipos
- ✅ Ver estado de sus tickets en tiempo real
- ✅ Seguimiento de tickets pendientes, en progreso y resueltos
- ✅ Interfaz intuitiva y moderna

### Para Técnicos IT:
- ✅ Panel de control con estadísticas en tiempo real
- ✅ Asignación de tickets
- ✅ Gestión de prioridades (Baja, Media, Alta)
- ✅ Cambio de estados (Pendiente, En Progreso, Resuelto)
- ✅ Sistema de comentarios para documentar el trabajo realizado
- ✅ Filtros por estado (Todos, Pendientes, Mis Tickets)
- ✅ Visualización detallada de cada ticket

## 🎯 Tipos de Equipos Soportados

1. **PC / Computadora**
2. **Impresora**
3. **Telefonía IP**
4. **Red / Conectividad**
5. **Software**
6. **Otro**

## 👥 Usuarios del Sistema

El sistema contempla 2 roles:

### 1. Usuario (Solicitante)
- Crea tickets para reportar problemas
- Visualiza el estado de sus tickets
- Recibe notificaciones de actualizaciones

### 2. Técnico IT
- Gestiona todos los tickets del sistema
- Asigna tickets a sí mismo
- Cambia prioridades y estados
- Agrega comentarios sobre el trabajo realizado
- Ve estadísticas del servicio

## 🚀 Implementación

### Versión Demo (Actual)
La versión HTML proporcionada usa **localStorage** para simular una base de datos. Es perfecta para:
- Demostración del sistema
- Pruebas de funcionalidad
- Validación de flujos de trabajo

**Usuarios de prueba incluidos:**
- **Usuario:** `usuario1` / Contraseña: `1234`
- **Usuario:** `usuario2` / Contraseña: `1234`
- **Técnico:** `tecnico1` / Contraseña: `1234`
- **Técnico:** `tecnico2` / Contraseña: `1234`
- **Técnico:** `tecnico3` / Contraseña: `1234`
- **Técnico:** `tecnico4` / Contraseña: `1234`
- **Técnico:** `tecnico5` / Contraseña: `1234`
- **Técnico:** `tecnico6` / Contraseña: `1234`

### Versión Producción (Recomendada)

Para implementar en producción, necesitarás:

#### 1. Backend (Opciones):

**Opción A: Node.js + Express**
```javascript
// Ejemplo de API REST
const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();

app.post('/api/tickets', (req, res) => {
    // Crear ticket
});

app.get('/api/tickets', (req, res) => {
    // Obtener tickets
});

app.put('/api/tickets/:id', (req, res) => {
    // Actualizar ticket
});
```

**Opción B: Python + Flask**
```python
from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

@app.route('/api/tickets', methods=['POST'])
def crear_ticket():
    # Lógica para crear ticket
    pass

@app.route('/api/tickets', methods=['GET'])
def obtener_tickets():
    # Lógica para obtener tickets
    pass
```

**Opción C: PHP + MySQL**
```php
<?php
// Conexión a base de datos
$conn = new mysqli("localhost", "usuario", "password", "tickets_db");

// Crear ticket
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $conn->prepare("INSERT INTO tickets (titulo, descripcion, ...) VALUES (?, ?, ...)");
    // ...
}
?>
```

#### 2. Base de Datos

Ejecutar el archivo `base_datos.sql` proporcionado:

```bash
# Para SQLite
sqlite3 tickets.db < base_datos.sql

# Para MySQL
mysql -u usuario -p nombre_base_datos < base_datos.sql

# Para PostgreSQL
psql -U usuario -d nombre_base_datos -f base_datos.sql
```

#### 3. Seguridad (IMPORTANTE)

**⚠️ NO usar contraseñas en texto plano en producción**

Implementar:
- **Hash de contraseñas** (bcrypt, argon2)
- **Autenticación JWT** o sesiones seguras
- **HTTPS** obligatorio
- **Validación de inputs** (SQL injection, XSS)
- **Rate limiting** para prevenir ataques
- **CORS** configurado correctamente

Ejemplo con bcrypt (Node.js):
```javascript
const bcrypt = require('bcrypt');

// Al crear usuario
const hashedPassword = await bcrypt.hash(password, 10);

// Al hacer login
const match = await bcrypt.compare(password, hashedPassword);
```

## 📊 Estructura de la Base de Datos

### Tablas Principales:

1. **usuarios**
   - id, username, password, nombre, rol, email, activo

2. **tickets**
   - id, tipo, titulo, descripcion, ubicacion, usuario_id
   - estado, prioridad, asignado_a
   - fecha_creacion, fecha_actualizacion, fecha_resolucion

3. **comentarios**
   - id, ticket_id, usuario_id, texto, fecha_creacion

4. **historial** (opcional, para auditoría)
   - id, ticket_id, usuario_id, accion, fecha

## 🎨 Personalización

### Cambiar Colores
Modificar las variables CSS en la sección `:root`:

```css
:root {
    --bg-primary: #0a0e17;          /* Fondo principal */
    --accent-primary: #00d9ff;      /* Color acento principal */
    --accent-secondary: #ff006e;    /* Color acento secundario */
    /* ... */
}
```

### Agregar Campos Personalizados
1. Modificar el formulario HTML
2. Actualizar la base de datos
3. Ajustar las funciones JavaScript

## 📱 Características Técnicas

- **Responsive Design**: Se adapta a móviles, tablets y escritorio
- **Animaciones Suaves**: Transiciones CSS para mejor UX
- **Accesibilidad**: Controles con teclado, semántica HTML
- **Performance**: Optimizado para carga rápida
- **Sin Dependencias**: JavaScript vanilla, sin frameworks

## 🔄 Flujo de Trabajo

### Para Usuarios:
1. Iniciar sesión
2. Ir a "Nuevo Ticket"
3. Completar formulario (tipo, título, descripción, ubicación)
4. Crear ticket
5. Seguimiento en "Mis Tickets"

### Para Técnicos:
1. Iniciar sesión
2. Ver panel con estadísticas
3. Revisar tickets pendientes
4. Asignarse un ticket
5. Cambiar estado a "En Progreso"
6. Agregar comentarios del trabajo realizado
7. Actualizar prioridad si es necesario
8. Marcar como "Resuelto" al finalizar

## 📈 Estadísticas Disponibles

- Total de tickets
- Tickets pendientes
- Tickets en progreso
- Tickets resueltos
- Tickets por técnico
- Tiempo promedio de resolución
- Tickets por tipo de equipo

## 🔧 Mantenimiento

### Respaldo de Datos
```bash
# SQLite
sqlite3 tickets.db .dump > backup.sql

# MySQL
mysqldump -u usuario -p tickets_db > backup.sql
```

### Limpieza de Datos Antiguos
```sql
-- Eliminar tickets resueltos hace más de 6 meses
DELETE FROM tickets 
WHERE estado = 'resuelto' 
AND fecha_resolucion < DATE('now', '-6 months');
```

## 🆘 Soporte y Mejoras Futuras

### Posibles Mejoras:
- [ ] Notificaciones por email
- [ ] Dashboard con gráficos
- [ ] Exportar reportes a PDF/Excel
- [ ] Sistema de archivos adjuntos
- [ ] Chat en tiempo real
- [ ] App móvil nativa
- [ ] Integración con WhatsApp/Telegram
- [ ] Sistema de SLA (Service Level Agreement)
- [ ] Métricas avanzadas de rendimiento
- [ ] Sistema de priorización automática

## 📄 Licencia

Sistema desarrollado para uso interno de la clínica.

## 🤝 Contribuciones

Para agregar nuevas funcionalidades o reportar bugs, contactar al equipo de desarrollo IT.

---

**Desarrollado con ❤️ para el equipo de Soporte IT de la Clínica**
