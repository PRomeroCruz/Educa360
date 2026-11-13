export function registrarLogSistema(tipo, usuario, mensaje) {
    console.log(`[LOG SYSTEM] [${tipo}] Usuario: ${usuario} - ${mensaje}`);
    // Aquí puedes añadir la lógica para guardar en Firestore o base de datos si lo requieres
}