/**
 * Datos de prueba totalmente ficticios para Educa360.
 * Ejecutar solo contra emuladores locales. Nunca contiene información real.
 */

import { getUserUidsByEmail, USERS } from "./seed-usuarios.js";

const DOCS_EXCLUIDOS_DE_PERFIL = new Set([
    "adminsistema@educa360.test",
    "medico@educa360.test",
    "paciente@educa360.test",
    "alumno@educa360.test",
]);

function parseNombreCompleto(displayName) {
    const partes = (displayName || "").trim().split(/\s+/);
    if (partes.length <= 1) {
        return { nombre: displayName || "Usuario", apellidos: "Ficticio de Prueba" };
    }
    return { nombre: partes[0], apellidos: partes.slice(1).join(" ") };
}

function fechaNacimientoAleatoria(seed) {
    const base = new Date(1960, 0, 1);
    const dias = (seed * 997) % (55 * 365);
    base.setDate(base.getDate() + dias);
    return base.toISOString().split("T")[0];
}

const IDS = {
    sedeNorte: "seed-sede-norte",
    sedeSur: "seed-sede-sur",
    sedeCentro: "seed-sede-centro",

    servicioMedicinaGeneral: "seed-servicio-mg",
    servicioPediatria: "seed-servicio-ped",
    servicioFisioterapia: "seed-servicio-fisio",
    servicioOdontologia: "seed-servicio-odon",

    profesionalLaura: "seed-prof-laura",
    profesionalElio: "seed-prof-elio",

    pacienteMaria: "seed-paciente-maria",
    pacienteMariaJose: "seed-paciente-mariajose",
    pacienteAeroldo: "seed-paciente-aeroldo",
    pacienteSinCitas: "seed-paciente-sincitas",

    citaPendiente: "seed-cita-pendiente",
    citaConfirmada: "seed-cita-confirmada",
    citaCompletada: "seed-cita-completada",
    citaCancelada: "seed-cita-cancelada",
    citaFisioterapia: "seed-cita-fisio",
    citaOdontologia: "seed-cita-odon",

    actoBorrador1: "seed-acto-borrador-1",
    actoBorrador2: "seed-acto-borrador-2",
    actoFirmado: "seed-acto-firmado",

    solicitudAnalitica: "seed-solicitud-analitica",
    solicitudRadiografia: "seed-solicitud-rx",

    resultadoAnalitica: "seed-resultado-analitica",
    resultadoRadiografia: "seed-resultado-rx",

    casoFractura: "seed-caso-fractura",
    casoDermatitis: "seed-caso-dermatitis",

    asignacionFractura: "seed-asignacion-fractura",
    asignacionDermatitis: "seed-asignacion-dermatitis",

    contenidoBanner: "seed-contenido-banner",

    auditoriaLoginAdmin: "seed-audit-login-admin",
    auditoriaLoginPaciente: "seed-audit-login-paciente",
    auditoriaCitaCreada: "seed-audit-cita-creada",
};

const now = new Date();
const offset = (days, hours = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours, 0, 0, 0);
    return d.toISOString();
};

export async function seedTestData({ authAdmin, firestoreAdmin }) {
    const uids = await getUserUidsByEmail(authAdmin);

    const uid = (email) => {
        const value = uids[email];
        if (!value) throw new Error(`[seed] No se encontró uid para ${email}`);
        return value;
    };

    const uidAdmin = uid("adminsistema@educa360.test");
    const uidMedico = uid("medico@educa360.test");
    const uidPaciente = uid("paciente@educa360.test");
    const uidAlumno = uid("alumno@educa360.test");

    // 1. SEDES (solo emulador)
    const sedes = [
        { id: IDS.sedeNorte, nombre: "Centro Sanitario Educa360 Norte", direccion: "Calle Ficticia, 123, 28001 Madrid", telefono: "+34900111001" },
        { id: IDS.sedeSur, nombre: "Centro Sanitario Educa360 Sur", direccion: "Avenida del Prado, 45, 28014 Madrid", telefono: "+34900111002" },
        { id: IDS.sedeCentro, nombre: "Centro Sanitario Educa360 Centro", direccion: "Plaza de la Constitución, 1, 28013 Madrid", telefono: "+34900111003" },
    ];
    for (const s of sedes) {
        await firestoreAdmin.collection("sedes").doc(s.id).set(s);
    }
    console.info(`[seed] ${sedes.length} sedes creadas.`);

    // 2. SERVICIOS (solo emulador)
    const servicios = [
        { id: IDS.servicioMedicinaGeneral, nombre: "Medicina General", descripcion: "Atención primaria y revisiones generales.", sedeId: IDS.sedeCentro },
        { id: IDS.servicioPediatria, nombre: "Pediatría", descripcion: "Consulta infantil y control de crecimiento.", sedeId: IDS.sedeNorte },
        { id: IDS.servicioFisioterapia, nombre: "Fisioterapia", descripcion: "Rehabilitación y tratamiento del dolor.", sedeId: IDS.sedeSur },
        { id: IDS.servicioOdontologia, nombre: "Odontología", descripcion: "Revisión dental y limpiezas.", sedeId: IDS.sedeCentro },
    ];
    for (const s of servicios) {
        await firestoreAdmin.collection("servicios").doc(s.id).set(s);
    }
    console.info(`[seed] ${servicios.length} servicios creados.`);

    // 3. PROFESIONALES
    const profesionales = [
        {
            id: IDS.profesionalLaura,
            usuario_id: uidMedico,
            nombre: "Dra. Laura Martínez",
            especialidad: "Medicina General",
            numero_colegiado: "M-12345",
            telefono: "+34600111002",
            email: "medico@educa360.test",
            sedeId: IDS.sedeCentro,
            servicioId: IDS.servicioMedicinaGeneral,
        },
        {
            id: IDS.profesionalElio,
            usuario_id: null,
            nombre: "Dr. Elio Vega-Ruiz",
            especialidad: "Fisioterapia",
            numero_colegiado: "F-98765",
            telefono: "+34600999001",
            email: "elio.vega@educa360.test",
            sedeId: IDS.sedeSur,
            servicioId: IDS.servicioFisioterapia,
        },
    ];
    for (const p of profesionales) {
        await firestoreAdmin.collection("profesionales").doc(p.id).set(p);
    }
    console.info(`[seed] ${profesionales.length} profesionales creados.`);

    // 4. PACIENTES
    const pacientes = [
        {
            id: IDS.pacienteMaria,
            ownerId: uidPaciente,
            nombre: "María",
            apellidos: "López García",
            email: "paciente@educa360.test",
            telefono: "+34600111004",
            fecha_nacimiento: "1985-03-12",
            direccion: "Calle del Lago, 10, 28001 Madrid",
            notas: "Alergia al látex.",
        },
        {
            id: IDS.pacienteMariaJose,
            ownerId: null,
            nombre: "María José",
            apellidos: "Álvarez-Méndez Ñuñez de la Fuente-Ochoa",
            email: "mariajose.ejemplo@educa360.test",
            telefono: "+34600222002",
            fecha_nacimiento: "1990-07-23",
            direccion: "Avenida de la Constitución, 88, 28004 Madrid",
            notas: "Nombre largo con acentos y eñe para pruebas de interfaz.",
        },
        {
            id: IDS.pacienteAeroldo,
            ownerId: null,
            nombre: "Æroldo",
            apellidos: "O'Brien-Sánchez III",
            email: "aeroldo.ejemplo@educa360.test",
            telefono: "+34600333003",
            fecha_nacimiento: "1978-11-05",
            direccion: "Paseo del Príncipe, 21, 28008 Madrid",
            notas: "Apellido con apóstrofo y carácter especial (Æ).",
        },
        {
            id: IDS.pacienteSinCitas,
            ownerId: null,
            nombre: "Esteban",
            apellidos: "Nunca-Cita Roldán",
            email: "estebancita.ejemplo@educa360.test",
            telefono: "+34600444004",
            fecha_nacimiento: "1995-01-30",
            direccion: "Calle Ancha, 5, 28012 Madrid",
            notas: "Paciente registrado sin citas previas.",
        },
    ];
    for (const p of pacientes) {
        await firestoreAdmin.collection("pacientes").doc(p.id).set(p);
    }
    console.info(`[seed] ${pacientes.length} pacientes creados.`);

    // 5. CITAS
    const citas = [
        {
            id: IDS.citaPendiente,
            pacienteId: IDS.pacienteMaria,
            profesionalId: IDS.profesionalLaura,
            sedeId: IDS.sedeCentro,
            servicioId: IDS.servicioMedicinaGeneral,
            fecha: offset(2, 10),
            estado: "Pendiente",
            motivo: "Revisión anual.",
        },
        {
            id: IDS.citaConfirmada,
            pacienteId: IDS.pacienteMariaJose,
            profesionalId: IDS.profesionalLaura,
            sedeId: IDS.sedeCentro,
            servicioId: IDS.servicioMedicinaGeneral,
            fecha: offset(3, 9),
            estado: "Confirmada",
            motivo: "Dolor de cabeza recurrente.",
        },
        {
            id: IDS.citaCompletada,
            pacienteId: IDS.pacienteAeroldo,
            profesionalId: IDS.profesionalLaura,
            sedeId: IDS.sedeCentro,
            servicioId: IDS.servicioMedicinaGeneral,
            fecha: offset(-2, 11),
            estado: "Completada",
            motivo: "Control de tensión arterial.",
        },
        {
            id: IDS.citaCancelada,
            pacienteId: IDS.pacienteMariaJose,
            profesionalId: IDS.profesionalLaura,
            sedeId: IDS.sedeCentro,
            servicioId: IDS.servicioMedicinaGeneral,
            fecha: offset(-1, 10),
            estado: "Cancelada",
            motivo: "Consulta cancelada por el paciente.",
        },
        {
            id: IDS.citaFisioterapia,
            pacienteId: IDS.pacienteAeroldo,
            profesionalId: IDS.profesionalElio,
            sedeId: IDS.sedeSur,
            servicioId: IDS.servicioFisioterapia,
            fecha: offset(4, 12),
            estado: "Confirmada",
            motivo: "Rehabilitación de hombro.",
        },
        {
            id: IDS.citaOdontologia,
            pacienteId: IDS.pacienteMaria,
            profesionalId: IDS.profesionalLaura,
            sedeId: IDS.sedeCentro,
            servicioId: IDS.servicioOdontologia,
            fecha: offset(5, 16),
            estado: "Pendiente",
            motivo: "Revisión dental de rutina.",
        },
    ];
    for (const c of citas) {
        await firestoreAdmin.collection("citas").doc(c.id).set(c);
    }
    console.info(`[seed] ${citas.length} citas creadas.`);

    // 6. ACTOS CLÍNICOS
    const actos = [
        {
            id: IDS.actoBorrador1,
            professional_id: uidMedico,
            paciente_id: IDS.pacienteMaria,
            cita_id: IDS.citaCompletada,
            estado: "Borrador",
            diagnostico: "Hipertensión arterial leve.",
            tratamiento: "Dieta baja en sodio + control en 3 meses.",
            notas: "Borrador pendiente de firmar.",
        },
        {
            id: IDS.actoBorrador2,
            professional_id: uidMedico,
            paciente_id: IDS.pacienteAeroldo,
            cita_id: IDS.citaCompletada,
            estado: "Borrador",
            diagnostico: "Tendinitis de hombro derecho.",
            tratamiento: "Fisioterapia 2 veces por semana.",
            notas: "Segundo borrador de prueba.",
        },
        {
            id: IDS.actoFirmado,
            professional_id: uidMedico,
            paciente_id: IDS.pacienteMariaJose,
            cita_id: IDS.citaConfirmada,
            estado: "Firmado",
            diagnostico: "Cefalea tensional.",
            tratamiento: "Hidratación, descanso y paracetamol si es necesario.",
            notas: "Acto clínico firmado.",
        },
    ];
    for (const a of actos) {
        await firestoreAdmin.collection("actos_clinicos").doc(a.id).set(a);
    }
    console.info(`[seed] ${actos.length} actos clínicos creados.`);

    // 7. SOLICITUDES DE PRUEBA + RESULTADOS
    const solicitudes = [
        {
            id: IDS.solicitudAnalitica,
            pacienteId: IDS.pacienteMaria,
            profesionalId: IDS.profesionalLaura,
            tipo: "Analítica sanguínea",
            estado: "Completada",
            fecha_solicitud: offset(-3, 9),
            notas: "Control de colesterol y glucosa.",
        },
        {
            id: IDS.solicitudRadiografia,
            pacienteId: IDS.pacienteAeroldo,
            profesionalId: IDS.profesionalElio,
            tipo: "Radiografía de hombro",
            estado: "Pendiente",
            fecha_solicitud: offset(1, 10),
            notas: "Dolor post-traumático.",
        },
    ];
    for (const s of solicitudes) {
        await firestoreAdmin.collection("solicitudes_prueba").doc(s.id).set(s);
    }
    console.info(`[seed] ${solicitudes.length} solicitudes de prueba creadas.`);

    const resultados = [
        {
            id: IDS.resultadoAnalitica,
            solicitudId: IDS.solicitudAnalitica,
            pacienteId: IDS.pacienteMaria,
            tipo: "Analítica sanguínea",
            resultado: "Colesterol total: 195 mg/dL. Glucosa: 92 mg/dL. Todo dentro de rango.",
            fecha_resultado: offset(-1, 11),
            estado: "Normal",
        },
        {
            id: IDS.resultadoRadiografia,
            solicitudId: IDS.solicitudRadiografia,
            pacienteId: IDS.pacienteAeroldo,
            tipo: "Radiografía de hombro",
            resultado: "Sin fracturas. Signos de tendinitis supraespinosa.",
            fecha_resultado: offset(2, 11),
            estado: "Patológico leve",
        },
    ];
    for (const r of resultados) {
        await firestoreAdmin.collection("resultados").doc(r.id).set(r);
    }
    console.info(`[seed] ${resultados.length} resultados creados.`);

    // 8. CASOS DE PRÁCTICA + ASIGNACIONES DOCENTES
    const casos = [
        {
            id: IDS.casoFractura,
            titulo: "Caso clínico: fractura de radio distal",
            descripcion:
                "Paciente de 67 años presenta caída con mano en extensión. Se sospecha fractura de radio distal tipo Colles.",
            especialidad: "Traumatología",
            nivel_dificultad: "Intermedio",
        },
        {
            id: IDS.casoDermatitis,
            titulo: "Caso clínico: dermatitis atópica",
            descripcion:
                "Paciente pediátrico de 5 años con lesiones eczematosas en pliegues. Se pide valoración y plan de cuidados.",
            especialidad: "Dermatología",
            nivel_dificultad: "Básico",
        },
    ];
    for (const c of casos) {
        await firestoreAdmin.collection("casos_practica").doc(c.id).set(c);
    }
    console.info(`[seed] ${casos.length} casos de práctica creados.`);

    const asignaciones = [
        {
            id: IDS.asignacionFractura,
            alumno_id: uidAlumno,
            caso_id: IDS.casoFractura,
            profesor_id: uidMedico,
            fecha_asignacion: now.toISOString(),
            estado: "Pendiente",
            notas: "Resolver historia clínica y plan de tratamiento.",
        },
        {
            id: IDS.asignacionDermatitis,
            alumno_id: uidAlumno,
            caso_id: IDS.casoDermatitis,
            profesor_id: uidMedico,
            fecha_asignacion: now.toISOString(),
            estado: "En progreso",
            notas: "Incluir recomendaciones de higiene y tratamiento tópico.",
        },
    ];
    for (const a of asignaciones) {
        await firestoreAdmin.collection("asignaciones_docentes").doc(a.id).set(a);
    }
    console.info(`[seed] ${asignaciones.length} asignaciones docentes creadas.`);

    // 9. CONTENIDO DEL PORTAL
    await firestoreAdmin.collection("contenido_portal").doc(IDS.contenidoBanner).set({
        titulo: "Entorno de pruebas Educa360",
        cuerpo: "Este es un entorno local con datos ficticios. Ningún dato clínico es real.",
        autor_id: uidAdmin,
        fecha_publicacion: now.toISOString(),
        activo: true,
    });
    console.info("[seed] 1 contenido del portal creado.");

    // 10. AUDITORÍA
    const auditoria = [
        {
            id: IDS.auditoriaLoginAdmin,
            usuario_id: uidAdmin,
            paciente_id: uidAdmin,
            tipo_entidad: "login",
            accion: "inicio_sesion",
            fecha: offset(-5, 8),
            detalles: "Inicio de sesión del administrador en entorno local.",
        },
        {
            id: IDS.auditoriaLoginPaciente,
            usuario_id: uidPaciente,
            paciente_id: uidPaciente,
            tipo_entidad: "login",
            accion: "inicio_sesion",
            fecha: offset(-4, 9),
            detalles: "Inicio de sesión del paciente de prueba.",
        },
        {
            id: IDS.auditoriaCitaCreada,
            usuario_id: uidPaciente,
            paciente_id: IDS.pacienteMaria,
            tipo_entidad: "cita",
            accion: "creacion",
            fecha: offset(-3, 10),
            detalles: "Cita creada desde el entorno local.",
        },
    ];
    for (const a of auditoria) {
        await firestoreAdmin.collection("auditoria").doc(a.id).set(a);
    }
    console.info(`[seed] ${auditoria.length} registros de auditoría creados.`);

    // 11. PERFILES EXTENDIDOS PARA USUARIOS ADICIONALES
    let perfilesCreados = 0;
    const usuariosConPerfil = USERS.filter((u) => !DOCS_EXCLUIDOS_DE_PERFIL.has(u.email));

    for (let i = 0; i < usuariosConPerfil.length; i++) {
        const u = usuariosConPerfil[i];
        const userUid = uids[u.email];
        if (!userUid) continue;

        if (u.role === "paciente") {
            const { nombre, apellidos } = parseNombreCompleto(u.name);
            await firestoreAdmin.collection("pacientes").doc(`seed-paciente-extra-${i}`).set({
                ownerId: userUid,
                nombre,
                apellidos,
                email: u.email,
                telefono: u.phone,
                fecha_nacimiento: fechaNacimientoAleatoria(i),
                direccion: `Calle Ficticia de Prueba ${100 + i}, 280${(10 + (i % 90)).toString().padStart(2, "0")} Madrid`,
                notas: i === 0 ? "Paciente adicional sin citas previas." : `Nota de prueba ${i + 1}.`,
            });
            perfilesCreados++;
        }

        if (u.role === "profesional_sanitario") {
            await firestoreAdmin.collection("profesionales").doc(`seed-prof-extra-${i}`).set({
                usuario_id: userUid,
                nombre: u.name,
                especialidad: ["Medicina General", "Pediatría", "Fisioterapia", "Odontología"][i % 4],
                numero_colegiado: `C-${10000 + i}`,
                telefono: u.phone,
                email: u.email,
                sedeId: [IDS.sedeNorte, IDS.sedeSur, IDS.sedeCentro][i % 3],
                servicioId: [IDS.servicioMedicinaGeneral, IDS.servicioPediatria, IDS.servicioFisioterapia, IDS.servicioOdontologia][i % 4],
            });
            perfilesCreados++;
        }
    }

    console.info(`[seed] ${perfilesCreados} perfiles extendidos creados.`);
}
