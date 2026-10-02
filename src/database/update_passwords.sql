-- Actualizar contraseñas de administradores (la contraseña es 'admin123' para todos)
UPDATE administracion 
SET password = '$2a$10$.1opSud76hgjleBPvKX1KeqzwCgsMF3VIF16aqpuQB2CkINvDwZ9y'
WHERE usuario IN ('admin', 'soporte', 'ventas'); 