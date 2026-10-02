require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const { connectDB } = require('./config/db');
const siteConfig = require('./config/site');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com'],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(morgan('dev'));

app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: './'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    res.locals.path = req.path;
    res.locals.isAdmin = req.session.user && req.session.user.role === 'admin';
    res.locals.user = req.session.user;
    res.locals.site = siteConfig;
    next();
});

const validateProduct = [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('brand').trim().notEmpty().withMessage('La marca es requerida'),
    body('state').trim().notEmpty().withMessage('El estado es requerido'),
    body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo')
];

const upload = multer({
    dest: path.join(__dirname, 'public/images'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', async (req, res) => {
    try {
        const featuredProducts = await Product.find({ featured: true });
        res.render('index', {
            title: 'Electromax - Soluciones Electrónicas',
            featuredProducts
        });
    } catch (error) {
        console.error('Error al cargar inicio:', error);
        res.status(500).render('error', {
            title: 'Error del Servidor',
            message: 'No se pudo cargar la página de inicio.'
        });
    }
});

app.get('/productos', async (req, res) => {
    try {
        const products = await Product.find();
        res.render('products', {
            title: 'Catálogo de Artículos',
            products
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).render('error', {
            title: 'Error del Servidor',
            message: 'No se pudieron cargar los productos.'
        });
    }
});

app.get('/productos/:id', async (req, res) => {
    try {
        if (!Product.isValidId(req.params.id)) {
            return res.status(404).render('error', {
                title: 'Producto no encontrado',
                message: 'El producto solicitado no existe.'
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('error', {
                title: 'Producto no encontrado',
                message: 'El producto solicitado no existe.'
            });
        }

        res.render('product_detail', {
            title: product.name,
            product
        });
    } catch (error) {
        console.error('Error al obtener detalle del producto:', error);
        res.status(500).render('error', {
            title: 'Error del Servidor',
            message: 'No se pudo cargar el detalle del producto.'
        });
    }
});

app.get('/contact', (req, res) => {
    res.redirect('/contacto');
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.user = { username, role: 'admin' };
        res.redirect('/admin');
    } else {
        res.render('login', { error: 'Usuario o contraseña incorrectos' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/admin', requireAuth, async (req, res) => {
    try {
        const products = await Product.find();
        res.render('admin', {
            title: 'Admin - Electromax',
            products,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error en admin:', error);
        res.status(500).render('error', {
            title: 'Error del Servidor',
            message: 'No se pudo cargar el panel de administración.'
        });
    }
});

app.get('/admin/add', requireAuth, (req, res) => {
    res.render('add_product', {
        title: 'Agregar Producto',
        user: req.session.user
    });
});

app.post('/admin/add', requireAuth, upload.single('image'), validateProduct, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('add_product', {
            title: 'Agregar Producto',
            errors: errors.array(),
            user: req.session.user
        });
    }

    try {
        const { name, brand, state, price, description, featured, imageUrl: imageUrlField } = req.body;
        let imageUrl = imageUrlField?.trim() || '/images/default-product.svg';
        if (imageUrl && imageUrl.startsWith('images/')) {
            imageUrl = '/' + imageUrl;
        }
        if (req.file) {
            imageUrl = '/images/' + req.file.filename;
        }

        await Product.create({
            name,
            brand,
            state,
            price: parseFloat(price),
            description: description || '',
            imageUrl,
            featured: featured === 'on'
        });

        res.redirect('/admin');
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).render('error', {
            title: 'Error del Servidor',
            message: 'No se pudo crear el producto.'
        });
    }
});

app.get('/admin/edit/:id', requireAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Producto no encontrado'
            });
        }

        res.render('edit_product', {
            title: 'Editar Producto',
            product,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error al cargar edición:', error);
        res.status(500).render('error', {
            title: 'Error del Servidor',
            message: 'No se pudo cargar el producto.'
        });
    }
});

app.post('/admin/edit/:id', requireAuth, upload.single('image'), validateProduct, async (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;

    if (!errors.isEmpty()) {
        return res.status(400).render('edit_product', {
            title: 'Editar Producto',
            errors: errors.array(),
            product: { ...req.body, _id: id },
            user: req.session.user
        });
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Producto no encontrado'
            });
        }

        const { name, brand, state, price, description, featured, imageUrl: imageUrlField } = req.body;
        const updateData = {
            name,
            brand,
            state,
            price: parseFloat(price),
            description: description !== undefined ? description : product.description,
            featured: featured === 'on'
        };

        if (req.file) {
            updateData.imageUrl = '/images/' + req.file.filename;
        } else if (imageUrlField && imageUrlField.trim()) {
            let imageUrlValue = imageUrlField.trim();
            if (imageUrlValue.startsWith('images/')) {
                imageUrlValue = '/' + imageUrlValue;
            }
            updateData.imageUrl = imageUrlValue;
        }
        if (req.file) {
            updateData.imageUrl = '/images/' + req.file.filename;
        }

        await Product.updateById(id, updateData);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error al editar producto:', error);
        res.status(500).render('error', {
            title: 'Error del Servidor',
            message: 'No se pudo actualizar el producto.'
        });
    }
});

app.post('/admin/delete/:id', requireAuth, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).render('error', {
            title: 'Error del Servidor',
            message: 'No se pudo eliminar el producto.'
        });
    }
});

app.get('/contacto', (req, res) => {
    res.render('contact', {
        title: 'Contacto - Electromax',
        errors: null,
        formData: null,
        success: null
    });
});

app.post('/contacto', [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('subject').notEmpty().withMessage('El asunto es obligatorio'),
    body('message').notEmpty().withMessage('El mensaje es obligatorio')
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('contact', {
            title: 'Contacto - Electromax',
            errors: errors.array(),
            formData: req.body,
            success: null
        });
    }

    res.render('contact', {
        title: 'Contacto - Electromax',
        errors: null,
        formData: null,
        success: '¡Tu mensaje ha sido enviado con éxito!'
    });
});

app.get('/error', (req, res) => {
    res.render('error', {
        title: 'Error',
        message: req.query.message || 'Ha ocurrido un error'
    });
});

app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - No Encontrado',
        message: 'La página que buscas no existe'
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: '500 - Error del Servidor',
        message: err.message || 'Algo salió mal en el servidor'
    });
});

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Servidor activo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo iniciar el servidor:', error.message);
        process.exit(1);
    }
}

startServer();
