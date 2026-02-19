// server.js - Backend para Sistema de Tickets IT
// Requiere: npm install express sqlite3 bcrypt jsonwebtoken cors body-parser

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'tu_clave_secreta_super_segura_cambiar_en_produccion'; // CAMBIAR EN PRODUCCIÓN

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Servir archivos estáticos

// Conectar a la base de datos
const db = new sqlite3.Database('./tickets.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
    } else {
        console.log('✅ Conectado a la base de datos SQLite');
        inicializarBaseDatos();
    }
});

// Inicializar base de datos
function inicializarBaseDatos() {
    db.serialize(() => {
        // Crear tablas si no existen
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            rol VARCHAR(20) NOT NULL CHECK (rol IN ('usuario', 'tecnico')),
            email VARCHAR(100),
            activo BOOLEAN DEFAULT 1,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS tickets (
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
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS comentarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id INTEGER NOT NULL,
            usuario_id INTEGER NOT NULL,
            texto TEXT NOT NULL,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )`);

        // Crear usuario admin si no existe
        db.get("SELECT id FROM usuarios WHERE username = 'admin'", async (err, row) => {
            if (!row) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                db.run("INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)",
                    ['admin', hashedPassword, 'Administrador', 'tecnico']);
                console.log('✅ Usuario admin creado (username: admin, password: admin123)');
            }
        });
    });
}

// Middleware de autenticación
function autenticar(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.usuario = decoded;
        next();
    });
}

// ========== RUTAS DE AUTENTICACIÓN ==========

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    db.get('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [username], async (err, usuario) => {
        if (err) {
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: usuario.id, username: usuario.username, rol: usuario.rol },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            usuario: {
                id: usuario.id,
                username: usuario.username,
                nombre: usuario.nombre,
                rol: usuario.rol,
                email: usuario.email
            }
        });
    });
});

// Registro de nuevo usuario (solo para técnicos o admin)
app.post('/api/auth/registro', autenticar, async (req, res) => {
    if (req.usuario.rol !== 'tecnico') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { username, password, nombre, rol, email } = req.body;

    if (!username || !password || !nombre || !rol) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO usuarios (username, password, nombre, rol, email) VALUES (?, ?, ?, ?, ?)',
        [username, hashedPassword, nombre, rol, email],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'El usuario ya existe' });
                }
                return res.status(500).json({ error: 'Error al crear usuario' });
            }

            res.status(201).json({ 
                mensaje: 'Usuario creado exitosamente',
                id: this.lastID 
            });
        }
    );
});

// ========== RUTAS DE TICKETS ==========

// Obtener todos los tickets (con filtros)
app.get('/api/tickets', autenticar, (req, res) => {
    const { estado, prioridad, asignado_a, usuario_id } = req.query;
    
    let query = `
        SELECT 
            t.*,
            u1.nombre as usuario_nombre,
            u2.nombre as tecnico_nombre,
            (SELECT COUNT(*) FROM comentarios WHERE ticket_id = t.id) as total_comentarios
        FROM tickets t
        LEFT JOIN usuarios u1 ON t.usuario_id = u1.id
        LEFT JOIN usuarios u2 ON t.asignado_a = u2.id
        WHERE 1=1
    `;
    
    const params = [];

    if (estado) {
        query += ' AND t.estado = ?';
        params.push(estado);
    }

    if (prioridad) {
        query += ' AND t.prioridad = ?';
        params.push(prioridad);
    }

    if (asignado_a) {
        query += ' AND t.asignado_a = ?';
        params.push(asignado_a);
    }

    if (usuario_id) {
        query += ' AND t.usuario_id = ?';
        params.push(usuario_id);
    }

    // Si es usuario normal, solo ver sus tickets
    if (req.usuario.rol === 'usuario') {
        query += ' AND t.usuario_id = ?';
        params.push(req.usuario.id);
    }

    query += ' ORDER BY t.fecha_creacion DESC';

    db.all(query, params, (err, tickets) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener tickets' });
        }
        res.json(tickets);
    });
});

// Obtener un ticket específico
app.get('/api/tickets/:id', autenticar, (req, res) => {
    const ticketId = req.params.id;

    db.get(`
        SELECT 
            t.*,
            u1.nombre as usuario_nombre,
            u1.email as usuario_email,
            u2.nombre as tecnico_nombre,
            u2.email as tecnico_email
        FROM tickets t
        LEFT JOIN usuarios u1 ON t.usuario_id = u1.id
        LEFT JOIN usuarios u2 ON t.asignado_a = u2.id
        WHERE t.id = ?
    `, [ticketId], (err, ticket) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener ticket' });
        }

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        // Verificar permisos
        if (req.usuario.rol === 'usuario' && ticket.usuario_id !== req.usuario.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Obtener comentarios
        db.all(`
            SELECT c.*, u.nombre as autor_nombre
            FROM comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.ticket_id = ?
            ORDER BY c.fecha_creacion ASC
        `, [ticketId], (err, comentarios) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener comentarios' });
            }

            ticket.comentarios = comentarios;
            res.json(ticket);
        });
    });
});

// Crear nuevo ticket
app.post('/api/tickets', autenticar, (req, res) => {
    const { tipo, titulo, descripcion, ubicacion } = req.body;

    if (!tipo || !titulo || !descripcion || !ubicacion) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    db.run(`
        INSERT INTO tickets (tipo, titulo, descripcion, ubicacion, usuario_id, estado, prioridad)
        VALUES (?, ?, ?, ?, ?, 'pendiente', 'media')
    `, [tipo, titulo, descripcion, ubicacion, req.usuario.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al crear ticket' });
        }

        res.status(201).json({
            mensaje: 'Ticket creado exitosamente',
            id: this.lastID
        });
    });
});

// Actualizar ticket (solo técnicos)
app.put('/api/tickets/:id', autenticar, (req, res) => {
    if (req.usuario.rol !== 'tecnico') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const ticketId = req.params.id;
    const { estado, prioridad, asignado_a } = req.body;

    const campos = [];
    const valores = [];

    if (estado) {
        campos.push('estado = ?');
        valores.push(estado);
    }

    if (prioridad) {
        campos.push('prioridad = ?');
        valores.push(prioridad);
    }

    if (asignado_a !== undefined) {
        campos.push('asignado_a = ?');
        valores.push(asignado_a);
    }

    if (estado === 'resuelto') {
        campos.push('fecha_resolucion = CURRENT_TIMESTAMP');
    }

    campos.push('fecha_actualizacion = CURRENT_TIMESTAMP');
    valores.push(ticketId);

    const query = `UPDATE tickets SET ${campos.join(', ')} WHERE id = ?`;

    db.run(query, valores, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar ticket' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json({ mensaje: 'Ticket actualizado exitosamente' });
    });
});

// Asignar ticket a técnico
app.post('/api/tickets/:id/asignar', autenticar, (req, res) => {
    if (req.usuario.rol !== 'tecnico') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const ticketId = req.params.id;
    const tecnicoId = req.body.tecnico_id || req.usuario.id;

    db.run(`
        UPDATE tickets 
        SET asignado_a = ?, estado = 'en-progreso', fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [tecnicoId, ticketId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al asignar ticket' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json({ mensaje: 'Ticket asignado exitosamente' });
    });
});

// ========== RUTAS DE COMENTARIOS ==========

// Agregar comentario a un ticket
app.post('/api/tickets/:id/comentarios', autenticar, (req, res) => {
    const ticketId = req.params.id;
    const { texto } = req.body;

    if (!texto) {
        return res.status(400).json({ error: 'Texto del comentario requerido' });
    }

    // Verificar que el ticket existe
    db.get('SELECT id FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar ticket' });
        }

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        db.run(`
            INSERT INTO comentarios (ticket_id, usuario_id, texto)
            VALUES (?, ?, ?)
        `, [ticketId, req.usuario.id, texto], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error al crear comentario' });
            }

            // Actualizar fecha del ticket
            db.run('UPDATE tickets SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?', [ticketId]);

            res.status(201).json({
                mensaje: 'Comentario agregado exitosamente',
                id: this.lastID
            });
        });
    });
});

// ========== RUTAS DE ESTADÍSTICAS ==========

// Obtener estadísticas generales
app.get('/api/estadisticas', autenticar, (req, res) => {
    if (req.usuario.rol !== 'tecnico') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    db.get(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
            SUM(CASE WHEN estado = 'en-progreso' THEN 1 ELSE 0 END) as en_progreso,
            SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos
        FROM tickets
    `, (err, stats) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
        res.json(stats);
    });
});

// Obtener estadísticas por tipo
app.get('/api/estadisticas/tipos', autenticar, (req, res) => {
    if (req.usuario.rol !== 'tecnico') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    db.all(`
        SELECT 
            tipo,
            COUNT(*) as cantidad
        FROM tickets
        GROUP BY tipo
        ORDER BY cantidad DESC
    `, (err, stats) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
        res.json(stats);
    });
});

// ========== INICIAR SERVIDOR ==========

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar la base de datos:', err);
        } else {
            console.log('\n✅ Base de datos cerrada correctamente');
        }
        process.exit(0);
    });
});
