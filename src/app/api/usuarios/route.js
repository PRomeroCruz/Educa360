import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export const dynamic = "force-dynamic";

function getAuthAdmin() {
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
            initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "educa360-dev" });
        }
    }

    return getAuth();
}

export async function GET(request) {
    if (process.env.NODE_ENV === "development") {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
    }

    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

    if (!token) {
        return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
    }

    try {
        const authAdmin = getAuthAdmin();
        const decodedToken = await authAdmin.verifyIdToken(token);

        if (decodedToken.role !== "admin") {
            return NextResponse.json({ success: false, error: "No tienes permisos para acceder a esta información." }, { status: 403 });
        }

        const listUsersResult = await authAdmin.listUsers(1000);
        const usuarios = listUsersResult.users.map((userRecord) => ({
            uid: userRecord.uid,
            email: userRecord.email || "Sin correo",
            autorizado: userRecord.emailVerified,
            role: userRecord.customClaims?.role || "paciente",
            fuente: "Emulador Local Firebase Auth",
        }));

        return NextResponse.json(
            { success: true, usuarios },
            { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
        );
    } catch (error) {
        console.error("Error al verificar el acceso a /api/usuarios:", error);
        const code = error?.code || "";
        const status = ["auth/id-token-expired", "auth/id-token-revoked", "auth/argument-error", "auth/invalid-id-token"].includes(code)
            ? 401
            : 500;
        const message = status === 401
            ? "Tu sesión ha caducado. Vuelve a iniciar sesión."
            : "No se pudo completar la operación.";

        return NextResponse.json({ success: false, error: message }, { status });
    }
}
