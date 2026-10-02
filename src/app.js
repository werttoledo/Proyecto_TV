require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2/promise'); // Importar mysql2 con promesas
const expressLayouts = require('express-ejs-layouts');

// Inicialización de la aplicación
const app = express();

// Configuración de la base de datos MySQL
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('DATABASE_URL no está definida en el archivo .env');
    process.exit(1);
}

let dbPool;
async function connectToDatabase() {
    try {
        // Configuración detallada de la conexión
        const dbConfig = {
            uri: dbUrl,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        };

        console.log('Intentando conectar a la base de datos...');
        console.log('URL de conexión:', dbUrl.replace(/:[^:@]*@/, ':****@')); // Oculta la contraseña en los logs

        dbPool = mysql.createPool(dbConfig);

        // Verificar la conexión
        const connection = await dbPool.getConnection();
        console.log('Conexión exitosa a la base de datos MySQL');
        
        // Verificar que podemos acceder a las tablas
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tablas disponibles:', tables.map(t => Object.values(t)[0]).join(', '));
        
        // Verificar la tabla de administración
        const [admins] = await connection.query('SELECT usuario, email FROM administracion');
        console.log('Usuarios administradores:', admins.map(a => `${a.usuario} (${a.email})`).join(', '));

        connection.release();
    } catch (error) {
        console.error('Error detallado al conectar a la base de datos MySQL:');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code);
        console.error('Estado:', error.sqlState);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

connectToDatabase();

// Configuración de middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Configuración de EJS y Layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Hacer disponible el pool de la base de datos en app.locals
app.locals.db = dbPool; // Cambiado de 'supabase' a 'db'

// Rutas
const indexRoutes = require('./routes/index');
const ventasRoutes = require('./routes/ventas');
const contactoRoutes = require('./routes/contacto');
const adminRoutes = require('./routes/admin');
const carritoRouter = require('./routes/carrito');
const favoritosRouter = require('./routes/favoritos');

app.use('/', indexRoutes);
app.use('/ventas', ventasRoutes);
app.use('/contacto', contactoRoutes);
app.use('/admin', adminRoutes);
app.use('/api/carrito', carritoRouter);
app.use('/api/favoritos', favoritosRouter);

// Ruta para la vista del carrito
app.get('/carrito', (req, res) => {
    res.render('carrito', {
        title: 'Carrito de Compras',
        user: req.session.user || null
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Página no encontrada',
        message: 'La página que buscas no existe'
    });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error del servidor',
        message: 'Ha ocurrido un error inesperado'
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
}); 