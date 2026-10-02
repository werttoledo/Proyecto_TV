-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS railway;
USE railway;

-- Eliminamos tablas en orden inverso de dependencia para evitar errores de clave foránea
DROP TABLE IF EXISTS comentarios;
DROP TABLE IF EXISTS reparacion_equipos;
DROP TABLE IF EXISTS carrito;
DROP TABLE IF EXISTS favoritos;
DROP TABLE IF EXISTS articulos_ventas;
DROP TABLE IF EXISTS articulos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS administracion;
DROP TABLE IF EXISTS marcas;

-- Tabla de marcas
CREATE TABLE IF NOT EXISTS marcas (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    nombre_marca VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    id_marca INT,
    modelo VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('nuevo', 'reacondicionado', 'usado')),
    descripcion TEXT,
    imagen_url VARCHAR(255),
    stock INT DEFAULT 0,
    tipo_producto VARCHAR(50) NOT NULL CHECK (tipo_producto IN ('televisor', 'control', 'audifonos', 'cargador', 'otro')),
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_marca) REFERENCES marcas(id_marca)
);

-- Tabla de administración
CREATE TABLE IF NOT EXISTS administracion (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    email_verificado BOOLEAN DEFAULT FALSE,
    token_verificacion VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id_favorito INT AUTO_INCREMENT PRIMARY KEY,
    id_admin INT,
    id_producto INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_admin, id_producto),
    FOREIGN KEY (id_admin) REFERENCES administracion(id_admin),
    FOREIGN KEY (id_producto) REFERENCES articulos_ventas(id_venta)
);

-- Tabla de carrito de compras
CREATE TABLE IF NOT EXISTS carrito (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_admin INT,
    id_producto INT,
    cantidad INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_admin, id_producto),
    FOREIGN KEY (id_admin) REFERENCES administracion(id_admin),
    FOREIGN KEY (id_producto) REFERENCES articulos_ventas(id_venta)
);

-- Tabla de artículos
CREATE TABLE IF NOT EXISTS articulos (
    id_articulo INT AUTO_INCREMENT PRIMARY KEY,
    id_marca INT,
    modelo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    stock INT DEFAULT 0,
    FOREIGN KEY (id_marca) REFERENCES marcas(id_marca)
);

-- Tabla de artículos en venta
CREATE TABLE IF NOT EXISTS articulos_ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_articulo INT,
    precio DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('nuevo', 'reacondicionado', 'usado')),
    imagen_url VARCHAR(255),
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_articulo) REFERENCES articulos(id_articulo)
);

-- Tabla de reparación de equipos
CREATE TABLE IF NOT EXISTS reparacion_equipos (
    id_reparacion INT AUTO_INCREMENT PRIMARY KEY,
    id_articulo INT,
    descripcion_problema TEXT,
    solucion_aplicada TEXT,
    imagen_antes_url VARCHAR(255),
    imagen_despues_url VARCHAR(255),
    fecha_reparacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_articulo) REFERENCES articulos(id_articulo)
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT,
    nombre_cliente VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    comentario TEXT NOT NULL,
    valoracion INT CHECK (valoracion BETWEEN 1 AND 5),
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'pendiente',
    FOREIGN KEY (id_venta) REFERENCES articulos_ventas(id_venta)
);

-- Triggers para actualizar updated_at
DELIMITER $$

CREATE TRIGGER trigger_update_articulos_ventas
BEFORE UPDATE ON articulos_ventas
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END;
$$

CREATE TRIGGER trigger_update_carrito
BEFORE UPDATE ON carrito
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END;
$$

DELIMITER ;

-- Inserts para marcas si no existen
INSERT INTO marcas (nombre_marca)
SELECT * FROM (SELECT 'Samsung') AS tmp
WHERE NOT EXISTS (SELECT nombre_marca FROM marcas WHERE nombre_marca = 'Samsung');

INSERT INTO marcas (nombre_marca)
SELECT * FROM (SELECT 'LG') AS tmp
WHERE NOT EXISTS (SELECT nombre_marca FROM marcas WHERE nombre_marca = 'LG');

INSERT INTO marcas (nombre_marca)
SELECT * FROM (SELECT 'Sony') AS tmp
WHERE NOT EXISTS (SELECT nombre_marca FROM marcas WHERE nombre_marca = 'Sony');

-- Inserts para administradores
INSERT INTO administracion (usuario, password, nombre, email, email_verificado)
SELECT * FROM (
    SELECT 'admin', '$2a$10$.1opSud76hgjleBPvKX1KeqzwCgsMF3VIF16aqpuQB2CkINvDwZ9y', 'Administrador Principal', 'werttoledo@gmail.com', TRUE
) AS tmp
WHERE NOT EXISTS (SELECT usuario FROM administracion WHERE usuario = 'admin');

INSERT INTO administracion (usuario, password, nombre, email, email_verificado)
SELECT * FROM (
    SELECT 'soporte', '$2a$10$.1opSud76hgjleBPvKX1KeqzwCgsMF3VIF16aqpuQB2CkINvDwZ9y', 'Soporte Técnico', 'soporte@electromax.com', TRUE
) AS tmp
WHERE NOT EXISTS (SELECT usuario FROM administracion WHERE usuario = 'soporte');

INSERT INTO administracion (usuario, password, nombre, email, email_verificado)
SELECT * FROM (
    SELECT 'ventas', '$2a$10$.1opSud76hgjleBPvKX1KeqzwCgsMF3VIF16aqpuQB2CkINvDwZ9y', 'Gerente de Ventas', 'ventas@electromax.com', TRUE
) AS tmp
WHERE NOT EXISTS (SELECT usuario FROM administracion WHERE usuario = 'ventas'); 

INSERT INTO admin (correo, clave) VALUES
('werttoledo@gmail.com', 'wert130609');
