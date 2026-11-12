export const DASHBOARDS = {
    admin_sistema: "/admin/dashboard",
    profesional_sanitario: "/medico/dashboard",
    admin: "/admin-general/dashboard",
    alumno_practicas: "/alumno/dashboard",
    editor_contenidos: "/editor/dashboard",
    paciente: "/paciente/dashboard",
};

export function dashboardParaRol(role) {
    const normalizedRole = (role || "paciente").toLowerCase().trim();
    if (DASHBOARDS[normalizedRole]) return DASHBOARDS[normalizedRole];
    if (normalizedRole.includes("medico")) return DASHBOARDS.profesional_sanitario;
    return DASHBOARDS.paciente;
}

export function esRutaInterna(destination) {
    return typeof destination === "string"
        && destination.startsWith("/")
        && !destination.startsWith("//")
        && !destination.startsWith("/login")
        && !destination.startsWith("/acceso-denegado");
}

export function inferirRolDesdeEmail(email) {
    const normalizedEmail = (email || "").toLowerCase();
    if (normalizedEmail.includes("adminsistema")) return "admin_sistema";
    if (normalizedEmail.includes("medico")) return "profesional_sanitario";
    if (normalizedEmail.includes("administracion")) return "admin";
    if (normalizedEmail.includes("alumno")) return "alumno_practicas";
    if (normalizedEmail.includes("editor")) return "editor_contenidos";
    return "paciente";
}
