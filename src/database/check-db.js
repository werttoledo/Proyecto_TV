require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkAndUpdateDatabase() {
    let connection;
    try {
        // Conectar a la base de datos
        console.log('Conectando a la base de datos...');
        connection = await mysql.createConnection(process.env.DATABASE_URL);

        // Verificar si la base de datos existe
        const [databases] = await connection.query('SHOW DATABASES');
        const dbExists = databases.some(db => db.Database === 'tv');
        
        if (!dbExists) {
            console.log('La base de datos "tv" no existe. Creándola...');
            await connection.query('CREATE DATABASE IF NOT EXISTS tv');
            await connection.query('USE tv');
        } else {
            console.log('Base de datos "tv" encontrada.');
            await connection.query('USE tv');
        }

        // Verificar si la tabla administracion existe
        const [tables] = await connection.query('SHOW TABLES');
        const adminTableExists = tables.some(table => Object.values(table)[0] === 'administracion');

        if (!adminTableExists) {
            console.log('Creando tabla administracion...');
            await connection.query(`
                CREATE TABLE IF NOT EXISTS administracion (
                    id_admin INT AUTO_INCREMENT PRIMARY KEY,
                    usuario VARCHAR(50) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    nombre VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    email_verificado BOOLEAN DEFAULT FALSE,
                    token_verificacion VARCHAR(255),
                    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }

        // Verificar si existen administradores
        const [admins] = await connection.query('SELECT * FROM administracion');
        
        if (admins.length === 0) {
            console.log('No hay administradores. Creando administradores por defecto...');
            const password = await bcrypt.hash('admin123', 10);
            
            await connection.query(`
                INSERT INTO administracion (usuario, password, nombre, email, email_verificado)
                VALUES 
                ('admin', ?, 'Administrador Principal', 'admin@tv.com', TRUE),
                ('soporte', ?, 'Soporte Técnico', 'soporte@tv.com', TRUE),
                ('ventas', ?, 'Gerente de Ventas', 'ventas@tv.com', TRUE)
            `, [password, password, password]);
            
            console.log('Administradores creados exitosamente.');
        } else {
            console.log('Administradores existentes:');
            admins.forEach(admin => {
                console.log(`- ${admin.usuario} (${admin.email})`);
            });

            // Actualizar contraseñas si están vacías
            const emptyPasswords = admins.filter(admin => !admin.password || admin.password === '');
            if (emptyPasswords.length > 0) {
                console.log('Actualizando contraseñas vacías...');
                const password = await bcrypt.hash('admin123', 10);
                for (const admin of emptyPasswords) {
                    await connection.query(
                        'UPDATE administracion SET password = ? WHERE id_admin = ?',
                        [password, admin.id_admin]
                    );
                }
                console.log('Contraseñas actualizadas exitosamente.');
            }
        }

        console.log('Verificación de base de datos completada exitosamente.');
    } catch (error) {
        console.error('Error durante la verificación de la base de datos:');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code);
        console.error('Estado:', error.sqlState);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar la verificación
checkAndUpdateDatabase(); 