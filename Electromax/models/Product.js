const { pool } = require('../config/db');

function mapRow(row) {
    if (!row) return null;

    return {
        _id: row.id,
        name: row.name,
        brand: row.brand,
        state: row.state,
        description: row.description,
        price: parseFloat(row.price),
        imageUrl: row.image_url,
        featured: row.featured,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function isValidId(id) {
    return /^\d+$/.test(String(id));
}

class Product {
    static isValidId(id) {
        return isValidId(id);
    }

    static async find({ limit, featured } = {}) {
        const params = [];
        let query = 'SELECT * FROM products';
        const conditions = [];

        if (featured !== undefined) {
            conditions.push(`featured = $${params.length + 1}`);
            params.push(featured);
        }

        if (conditions.length) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';
        if (limit) {
            query += ` LIMIT $${params.length + 1}`;
            params.push(parseInt(limit, 10));
        }

        const result = await pool.query(query, params);
        return result.rows.map(mapRow);
    }

    static async findById(id) {
        if (!isValidId(id)) return null;

        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [parseInt(id, 10)]
        );
        return mapRow(result.rows[0]);
    }

    static async create({ name, brand, state, description = '', price, imageUrl, featured = false }) {
        const result = await pool.query(
            `INSERT INTO products (name, brand, state, description, price, image_url, featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, brand, state, description, price, imageUrl || '/images/default-product.svg', featured]
        );
        return mapRow(result.rows[0]);
    }

    static async updateById(id, { name, brand, state, description, price, imageUrl, featured }) {
        if (!isValidId(id)) return null;

        const result = await pool.query(
            `UPDATE products
             SET name = $1,
                 brand = $2,
                 state = $3,
                 description = COALESCE($4, description),
                 price = $5,
                 image_url = COALESCE($6, image_url),
                 featured = COALESCE($7, featured, featured),
                 updated_at = NOW()
             WHERE id = $8
             RETURNING *`,
            [name, brand, state, description, price, imageUrl, featured, parseInt(id, 10)]
        );
        return mapRow(result.rows[0]);
    }

    static async findByIdAndDelete(id) {
        if (!isValidId(id)) return null;

        const result = await pool.query(
            'DELETE FROM products WHERE id = $1 RETURNING *',
            [parseInt(id, 10)]
        );
        return mapRow(result.rows[0]);
    }
}

module.exports = Product;
