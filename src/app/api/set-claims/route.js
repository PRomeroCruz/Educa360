import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAuthAdmin() {
    if (process.env.NODE_ENV === "development") {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
    }

    if (!getApps().length) {
        if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            initializeApp({
                credential: cert({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                }),
            });
        } else {
            initializeApp({ projectId: "educa360-dev" });
        }
    }

    return getAuth();
}

function roleFromEmail(email) {
    const normalizedEmail = (email || "").toLowerCase();
    if (normalizedEmail.includes("adminsistema")) return "admin_sistema";
    if (normalizedEmail.includes("medico")) return "profesional_sanitario";
    if (normalizedEmail.includes("administracion")) return "admin";
    if (normalizedEmail.includes("alumno")) return "alumno_practicas";
    if (normalizedEmail.includes("editor")) return "editor_contenidos";
    return "paciente";
}

export async function POST(request) {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

    if (!token) {
        return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    try {
        const { uid, email, telefono } = await request.json();
        if (!uid) return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });

        const authAdmin = getAuthAdmin();
        const decodedToken = await authAdmin.verifyIdToken(token);

        if (decodedToken.uid !== uid) {
            return NextResponse.json({ error: "No tienes permisos para realizar esta operación." }, { status: 403 });
        }

        const role = roleFromEmail(email);
        await authAdmin.setCustomUserClaims(uid, { role, rol: role });

        if (telefono) {
            await authAdmin.updateUser(uid, { phoneNumber: telefono });
        }

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error("Error al actualizar claims:", error);
        const status = ["auth/id-token-expired", "auth/id-token-revoked", "auth/argument-error", "auth/invalid-id-token"].includes(error?.code)
            ? 401
            : 500;
        return NextResponse.json(
            { error: status === 401 ? "Tu sesión ha caducado. Vuelve a iniciar sesión." : "No se pudo completar la operación." },
            { status },
        );
    }
}
