require('dotenv').config();
const mysql = require('mysql2/promise');

// PARA PROBAR LA CONEXIÓN DIRECTAMENTE SIN DEPENDER DEL .env
// Comenta o elimina esta línea después de la prueba si quieres volver a usar el .env
process.env.DATABASE_URL = 'mysql://root:ezspjQXPtLkKRcUgxtYDpCbxkXGvPrGR@maglev.proxy.rlwy.net:29723/railway';

async function testConnection() {
    try {
        console.log('Intentando conectar a la base de datos...');
        console.log('URL de conexión:', process.env.DATABASE_URL);
        
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('¡Conexión exitosa!');
        
        // Verificar tablas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\nTablas encontradas:');
        tables.forEach(table => console.log(Object.values(table)[0]));
        
        // Verificar usuarios
        const [users] = await connection.execute('SELECT id_usuario, usuario, rol FROM usuarios LIMIT 5');
        console.log('\nUsuarios encontrados:');
        console.log(users);
        
        // Verificar productos
        const [products] = await connection.execute(`
            SELECT p.id_producto, p.nombre_producto, m.nombre_marca, p.tipo, p.stock 
            FROM productos p 
            JOIN marcas m ON p.id_marca = m.id_marca 
            LIMIT 5
        `);
        console.log('\nProductos encontrados:');
        console.log(products);
        
        await connection.end();
    } catch (error) {
        console.error('Error al conectar:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\nPosibles soluciones:');
            console.log('1. Verifica que las credenciales sean correctas');
            console.log('2. Asegúrate que el usuario tenga los permisos necesarios');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\nPosibles soluciones:');
            console.log('1. Verifica que el servidor de base de datos esté accesible');
            console.log('2. Confirma que el puerto sea correcto');
            console.log('3. Si es Railway, verifica que la URL de conexión pública sea válida y la instancia esté activa');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\nPosibles soluciones:');
            console.log("1. Verifica que la base de datos 'railway' (o la que uses) exista");
            console.log("2. Si es una base de datos diferente (como 'tienda'), ajusta la URL");
        }
    }
}

testConnection(); 