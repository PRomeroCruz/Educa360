import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PASSWORD = "123456";

const REQUIRED_USERS = [
    {
        name: "Carlos Sistema Admin",
        email: "adminsistema@educa360.test",
        phone: "+34600111001",
        role: "admin_sistema",
    },
    {
        name: "Dra. Laura Martínez",
        email: "medico@educa360.test",
        phone: "+34600111002",
        role: "profesional_sanitario",
    },
    {
        name: "Javier Gestión Citas",
        email: "administracion@educa360.test",
        phone: "+34600111003",
        role: "admin",
    },
    {
        name: "María López",
        email: "paciente@educa360.test",
        phone: "+34600111004",
        role: "paciente",
    },
    {
        name: "Alejandro Alumno",
        email: "alumno@educa360.test",
        phone: "+34600111005",
        role: "alumno_practicas",
    },
    {
        name: "Sofia Editora",
        email: "editor@educa360.test",
        phone: "+34600111006",
        role: "editor_contenidos",
    },
];

const EXTRA_USERS = [
    // Administradores del sistema
    { name: "Ana Sistema Admin", email: "adminsistema2@educa360.test", phone: "+34600111007", role: "admin_sistema" },

    // Administración general
    { name: "Luis Gestión Citas", email: "administracion2@educa360.test", phone: "+34600111008", role: "admin" },
    { name: "Carmen Administración", email: "administracion3@educa360.test", phone: "+34600111009", role: "admin" },
    { name: "Pedro Coordinación", email: "administracion4@educa360.test", phone: "+34600111010", role: "admin" },

    // Profesionales sanitarios (con nombres largos, acentos y caracteres especiales)
    { name: "Dr. Fernando José Martínez de la Torre y Gálvez", email: "medico2@educa360.test", phone: "+34600111011", role: "profesional_sanitario" },
    { name: "Dra. Elena Ruiz-Sánchez", email: "medico3@educa360.test", phone: "+34600111012", role: "profesional_sanitario" },
    { name: "Dr. Mario Gómez-Ñuñez", email: "medico4@educa360.test", phone: "+34600111013", role: "profesional_sanitario" },
    { name: "Dra. Isabel O'Brien", email: "medico5@educa360.test", phone: "+34600111014", role: "profesional_sanitario" },
    { name: "Dr. Hugo Váldez", email: "medico6@educa360.test", phone: "+34600111015", role: "profesional_sanitario" },
    { name: "Dra. Sara Pérez-López", email: "medico7@educa360.test", phone: "+34600111016", role: "profesional_sanitario" },

    // Alumnos en prácticas
    { name: "Lucía Alumna", email: "alumno2@educa360.test", phone: "+34600111017", role: "alumno_practicas" },
    { name: "Martín Estudiante", email: "alumno3@educa360.test", phone: "+34600111018", role: "alumno_practicas" },
    { name: "Noa García", email: "alumno4@educa360.test", phone: "+34600111019", role: "alumno_practicas" },
    { name: "Leo Fernández", email: "alumno5@educa360.test", phone: "+34600111020", role: "alumno_practicas" },
    { name: "Aitana Martín", email: "alumno6@educa360.test", phone: "+34600111021", role: "alumno_practicas" },
    { name: "Mateo Ruiz", email: "alumno7@educa360.test", phone: "+34600111022", role: "alumno_practicas" },

    // Editores de contenidos
    { name: "Clara Editora", email: "editor2@educa360.test", phone: "+34600111023", role: "editor_contenidos" },
    { name: "Tomás Contenidos", email: "editor3@educa360.test", phone: "+34600111024", role: "editor_contenidos" },

    // Pacientes variados (acentos, apellidos largos, guiones, apóstrofos, ñ)
    { name: "José Antonio García-Fernández López", email: "paciente2@educa360.test", phone: "+34600111025", role: "paciente" },
    { name: "María del Carmen De la Cruz Martínez", email: "paciente3@educa360.test", phone: "+34600111026", role: "paciente" },
    { name: "Ælvaro O'Connor", email: "paciente4@educa360.test", phone: "+34600111027", role: "paciente" },
    { name: "Beatriz Nuñez-Álvarez de la Fuente", email: "paciente5@educa360.test", phone: "+34600111028", role: "paciente" },
    { name: "Francisco Javier Rodríguez Carreño", email: "paciente6@educa360.test", phone: "+34600111029", role: "paciente" },
    { name: "Inmaculada Sánchez-Romero", email: "paciente7@educa360.test", phone: "+34600111030", role: "paciente" },
    { name: "Diego Hernández-Muñoz", email: "paciente8@educa360.test", phone: "+34600111031", role: "paciente" },
    { name: "Cristina Vallejo-López", email: "paciente9@educa360.test", phone: "+34600111032", role: "paciente" },
    { name: "Antonio Jesús Martín Pérez", email: "paciente10@educa360.test", phone: "+34600111033", role: "paciente" },
    { name: "Patricia Gómez del Río", email: "paciente11@educa360.test", phone: "+34600111034", role: "paciente" },
    { name: "Rafaela Iglesias-Campos", email: "paciente12@educa360.test", phone: "+34600111035", role: "paciente" },
    { name: "Miguel Ángel Torres-Vega", email: "paciente13@educa360.test", phone: "+34600111036", role: "paciente" },
];

export const USERS = [...REQUIRED_USERS, ...EXTRA_USERS];

function isLocalEmulator() {
    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "";
    const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || "";
    return (
        process.env.NODE_ENV === "development" &&
        authHost.includes("localhost") &&
        firestoreHost.includes("localhost")
    );
}

function requireLocalEmulator() {
    if (!isLocalEmulator()) {
        throw new Error(
            "[seed] Bloqueado por seguridad: el seed solo puede ejecutarse contra los emuladores locales. " +
            "Asegúrate de tener NODE_ENV=development y FIREBASE_AUTH_EMULATOR_HOST/FIRESTORE_EMULATOR_HOST apuntando a localhost."
        );
    }
}

function getAdminServices() {
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "localhost:9099";
    process.env.FIRESTORE_EMULATOR_HOST ||= "localhost:8080";

    requireLocalEmulator();

    if (!getApps().length) initializeApp({ projectId: "educa360-dev" });

    return {
        authAdmin: getAuth(),
        firestoreAdmin: getFirestore(),
    };
}

export async function waitForAuthEmulator(timeoutMs = 30000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        try {
            await fetch("http://localhost:9099/");
            return true;
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }
    }

    return false;
}

export async function seedTestUsers() {
    const { authAdmin, firestoreAdmin } = getAdminServices();

    for (const user of USERS) {
        let record = await authAdmin.getUserByEmail(user.email).catch(() => null);
        const created = !record;

        if (created) {
            record = await authAdmin.createUser({
                email: user.email,
                password: PASSWORD,
                displayName: user.name,
                phoneNumber: user.phone,
                emailVerified: true,
                disabled: false,
            });
        } else {
            record = await authAdmin.updateUser(record.uid, {
                password: PASSWORD,
                displayName: user.name,
                phoneNumber: user.phone,
                emailVerified: true,
                disabled: false,
            });
        }

        await authAdmin.setCustomUserClaims(record.uid, { role: user.role, rol: user.role });
        await firestoreAdmin.collection("usuarios").doc(record.uid).set({
            uid: record.uid,
            nombre: user.name,
            email: user.email,
            telefono: user.phone,
            role: user.role,
            ...(created ? { createdAt: new Date().toISOString() } : {}),
        }, { merge: true });

        console.info(`[seed] ${created ? "Creado" : "Actualizado"}: ${user.email}`);
    }

    console.info(`[seed] ${USERS.length} usuarios de prueba listos.`);
}

export async function getUserUidsByEmail(authAdmin) {
    const uids = {};
    for (const user of USERS) {
        const record = await authAdmin.getUserByEmail(user.email).catch(() => null);
        uids[user.email] = record?.uid || null;
    }
    return uids;
}

export async function seedCompleto() {
    const services = getAdminServices();
    const { seedTestData } = await import("./seed-datos.js");

    await seedTestUsers();
    await seedTestData(services);

    console.info("[seed] Carga completa finalizada.");
}
