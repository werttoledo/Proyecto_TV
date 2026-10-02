const defaultMessage = 'Hola Electromax, me gustaría obtener más información sobre sus productos y servicios.';

const whatsappNumber = (process.env.WHATSAPP_NUMBER || '573001234567').replace(/\D/g, '');

module.exports = {
    name: 'Electromax',
    tagline: 'Tu socio confiable en soluciones electrónicas',
    whatsappNumber,
    whatsappDisplay: process.env.WHATSAPP_DISPLAY || '+57 300 123 4567',
    phone: process.env.PHONE || '+57 300 123 4567',
    address: 'CL 23 24A 09 LC2 Barrio Catatumbo, Villavicencio, Meta',
    mapsUrl: 'https://www.google.com/maps/@4.13977,-73.6269734,3a,75y,173.06h,79.44t/data=!3m7!1e1!3m5!1sokV3W1E2Fa7UWznBTsdrQw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D10.560000000000002%26panoid%3DokV3W1E2Fa7UWznBTsdrQw%26yaw%3D173.06!7i16384!8i8192?entry=ttu',
    schedule: 'Lun - Sáb: 8:00 AM - 6:00 PM',
    getWhatsAppUrl(message = defaultMessage) {
        return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    }
};
