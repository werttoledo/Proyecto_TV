const { Pool } = require('pg');
const seedProducts = require('../data/seedProducts');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
});

async function initSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            brand VARCHAR(255) NOT NULL,
            state VARCHAR(100) NOT NULL,
            description TEXT DEFAULT '',
            price NUMERIC(10, 2) NOT NULL,
            image_url VARCHAR(500) DEFAULT '/images/default-product.svg',
            featured BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);

    await pool.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false
    `);
}

async function connectDB() {
    const uri = process.env.DATABASE_URL;

    if (!uri) {
        throw new Error(
            'DATABASE_URL no está configurada. Crea un archivo .env basado en .env.example con tu cadena de conexión de Neon.'
        );
    }

    await pool.query('SELECT NOW()');
    console.log('Base de datos conectada (PostgreSQL / Neon)');

    await initSchema();

    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM products');
    if (rows[0].count === 0) {
        const Product = require('../models/Product');
        for (const product of seedProducts) {
            await Product.create(product);
        }
        console.log(`${seedProducts.length} productos iniciales cargados en la base de datos`);
    }
}

module.exports = { pool, connectDB };
