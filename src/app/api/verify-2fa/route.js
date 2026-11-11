import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export async function POST(request) {
    try {
        const { uid, code } = await request.json();

        if (!uid || !code) {
        return NextResponse.json({ error: "UID y código son requeridos." }, { status: 400 });
        }

        const userDocRef = doc(db, "usuarios", uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
        return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
        }

        const userData = userSnap.data();
        const codigoLimpio = code.trim();

        const backupCodes = userData.backupCodes || [];
        if (backupCodes.includes(codigoLimpio)) {
        const nuevosBackupCodes = backupCodes.filter((c) => c !== codigoLimpio);
        await updateDoc(userDocRef, { backupCodes: nuevosBackupCodes });

        return NextResponse.json({ 
            success: true, 
            method: "backup",
            message: "Acceso concedido mediante código de recuperación." 
        });
        }

        const esCodigoTotpValido = /^\d{6}$/.test(codigoLimpio);

        if (esCodigoTotpValido) {
        return NextResponse.json({ success: true, method: "totp" });
        } else {
        return NextResponse.json(
            { error: "Código 2FA incorrecto o expirado. Introduce un código de 6 dígitos o tu clave de recuperación." },
            { status: 401 }
        );
        }
    } catch (error) {
        console.error("Error al verificar 2FA:", error);
        return NextResponse.json({ error: "Error interno al verificar el segundo factor." }, { status: 500 });
    }
}