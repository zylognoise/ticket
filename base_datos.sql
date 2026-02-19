-- Base de Datos para Sistema de Tickets IT - Clínica
-- Motor: SQLite / MySQL / PostgreSQL

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- En producción usar hash (bcrypt)
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('usuario', 'tecnico')),
    email VARCHAR(100),
    activo BOOLEAN DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tickets
CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    ubicacion VARCHAR(100) NOT NULL,
    usuario_id INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en-progreso', 'resuelto')),
    prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
    asignado_a INTEGER,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (asignado_a) REFERENCES usuarios(id)
);

-- Tabla de Comentarios
CREATE TABLE comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de Historial de Cambios (opcional, para auditoría)
CREATE TABLE historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    accion VARCHAR(50) NOT NULL,
    campo_modificado VARCHAR(50),
    valor_anterior VARCHAR(200),
    valor_nuevo VARCHAR(200),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_prioridad ON tickets(prioridad);
CREATE INDEX idx_tickets_usuario ON tickets(usuario_id);
CREATE INDEX idx_tickets_asignado ON tickets(asignado_a);
CREATE INDEX idx_comentarios_ticket ON comentarios(ticket_id);

-- Datos de ejemplo para usuarios
INSERT INTO usuarios (username, password, nombre, rol, email) VALUES
('usuario1', '1234', 'María García', 'usuario', 'maria.garcia@clinica.com'),
('usuario2', '1234', 'Juan Pérez', 'usuario', 'juan.perez@clinica.com'),
('tecnico1', '1234', 'Carlos Rodríguez', 'tecnico', 'carlos.rodriguez@clinica.com'),
('tecnico2', '1234', 'Ana Martínez', 'tecnico', 'ana.martinez@clinica.com'),
('tecnico3', '1234', 'Luis González', 'tecnico', 'luis.gonzalez@clinica.com'),
('tecnico4', '1234', 'Sofía López', 'tecnico', 'sofia.lopez@clinica.com'),
('tecnico5', '1234', 'Miguel Torres', 'tecnico', 'miguel.torres@clinica.com'),
('tecnico6', '1234', 'Laura Fernández', 'tecnico', 'laura.fernandez@clinica.com');

-- Datos de ejemplo para tickets
INSERT INTO tickets (tipo, titulo, descripcion, ubicacion, usuario_id, estado, prioridad, asignado_a) VALUES
('PC', 'PC no enciende en consultorio 3', 'La computadora del consultorio 3 no arranca. Al presionar el botón de encendido no responde.', 'Consultorio 3 - Planta Baja', 1, 'pendiente', 'alta', NULL),
('Impresora', 'Impresora atascada en recepción', 'La impresora HP de recepción tiene papel atascado y no imprime', 'Recepción - Planta Baja', 2, 'en-progreso', 'media', 3),
('Telefonía IP', 'Teléfono no tiene tono', 'El teléfono IP del consultorio 5 no tiene tono de marcado', 'Consultorio 5 - Primer Piso', 1, 'pendiente', 'alta', NULL),
('Red', 'Internet lento en área administrativa', 'La conexión a internet está muy lenta en el sector administrativo', 'Área Administrativa - Planta Baja', 2, 'resuelto', 'media', 4),
('Software', 'Error en sistema de historias clínicas', 'El software de HC se cierra inesperadamente al guardar', 'Consultorio 2 - Planta Baja', 1, 'en-progreso', 'alta', 5);

-- Datos de ejemplo para comentarios
INSERT INTO comentarios (ticket_id, usuario_id, texto) VALUES
(2, 3, 'Revisando el problema. Encontré papel atascado en el rodillo principal.'),
(2, 3, 'Papel retirado. Realizando prueba de impresión.'),
(4, 4, 'Problema resuelto. Era un conflicto con el router. Se reinició el equipo y se optimizó la configuración.'),
(5, 5, 'Identificado bug en la última actualización. Contactando con soporte del proveedor.');

-- Vista para obtener tickets con información completa
CREATE VIEW vista_tickets_completa AS
SELECT 
    t.id,
    t.tipo,
    t.titulo,
    t.descripcion,
    t.ubicacion,
    t.estado,
    t.prioridad,
    t.fecha_creacion,
    t.fecha_actualizacion,
    t.fecha_resolucion,
    u1.nombre AS usuario_nombre,
    u1.email AS usuario_email,
    u2.nombre AS tecnico_nombre,
    u2.email AS tecnico_email,
    (SELECT COUNT(*) FROM comentarios WHERE ticket_id = t.id) AS total_comentarios
FROM tickets t
LEFT JOIN usuarios u1 ON t.usuario_id = u1.id
LEFT JOIN usuarios u2 ON t.asignado_a = u2.id;

-- Trigger para actualizar fecha_actualizacion
CREATE TRIGGER actualizar_fecha_ticket
AFTER UPDATE ON tickets
BEGIN
    UPDATE tickets SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para registrar en historial cuando cambia el estado
CREATE TRIGGER historial_cambio_estado
AFTER UPDATE ON tickets
WHEN OLD.estado != NEW.estado
BEGIN
    INSERT INTO historial (ticket_id, usuario_id, accion, campo_modificado, valor_anterior, valor_nuevo)
    VALUES (NEW.id, NEW.asignado_a, 'CAMBIO_ESTADO', 'estado', OLD.estado, NEW.estado);
END;

-- Consultas útiles

-- 1. Obtener todos los tickets pendientes
SELECT * FROM vista_tickets_completa WHERE estado = 'pendiente' ORDER BY prioridad DESC, fecha_creacion ASC;

-- 2. Obtener tickets de un técnico específico
SELECT * FROM vista_tickets_completa WHERE tecnico_nombre = 'Carlos Rodríguez' ORDER BY fecha_creacion DESC;

-- 3. Estadísticas generales
SELECT 
    COUNT(*) as total_tickets,
    SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
    SUM(CASE WHEN estado = 'en-progreso' THEN 1 ELSE 0 END) as en_progreso,
    SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos,
    AVG(CASE 
        WHEN fecha_resolucion IS NOT NULL 
        THEN (JULIANDAY(fecha_resolucion) - JULIANDAY(fecha_creacion)) * 24 
        ELSE NULL 
    END) as tiempo_promedio_resolucion_horas
FROM tickets;

-- 4. Tickets por técnico
SELECT 
    u.nombre as tecnico,
    COUNT(t.id) as total_asignados,
    SUM(CASE WHEN t.estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos
FROM usuarios u
LEFT JOIN tickets t ON u.id = t.asignado_a
WHERE u.rol = 'tecnico'
GROUP BY u.id, u.nombre;

-- 5. Tickets por tipo de equipo
SELECT 
    tipo,
    COUNT(*) as cantidad,
    AVG(CASE 
        WHEN fecha_resolucion IS NOT NULL 
        THEN (JULIANDAY(fecha_resolucion) - JULIANDAY(fecha_creacion)) * 24 
        ELSE NULL 
    END) as tiempo_promedio_resolucion_horas
FROM tickets
GROUP BY tipo
ORDER BY cantidad DESC;
