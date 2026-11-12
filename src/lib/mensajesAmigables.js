const MENSAJES = {
    "auth/email-already-in-use": "Este correo ya está registrado en el sistema.",
    "auth/invalid-email": "El formato del correo electrónico no es válido.",
    "auth/invalid-credential": "El correo o la contraseña son incorrectos.",
    "auth/user-not-found": "El correo o la contraseña son incorrectos.",
    "auth/wrong-password": "El correo o la contraseña son incorrectos.",
    "auth/user-disabled": "Esta cuenta no está disponible.",
    "auth/too-many-requests": "Has realizado demasiados intentos. Espera unos minutos.",
    "auth/network-request-failed": "No se ha podido conectar. Comprueba tu conexión.",
    "permission-denied": "No tienes permisos para realizar esta operación.",
    "unauthenticated": "Tu sesión ha caducado. Vuelve a iniciar sesión.",
    "unavailable": "El servicio no está disponible ahora mismo. Inténtalo de nuevo más tarde.",
};

export function mensajeAmigable(error, fallback = "Ha ocurrido un error inesperado. Inténtalo de nuevo.") {
    const code = error?.code || "";
    return MENSAJES[code] || MENSAJES[code.replace(/^.*\//, "")] || fallback;
}
