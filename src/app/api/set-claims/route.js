import { NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export async function POST(request) {
    try {
        const { uid, role, phone } = await request.json();

        if (!uid) {
        return NextResponse.json({ error: "Falta el UID del usuario" }, { status: 400 });
        }

        if (role) {
        await admin.auth().setCustomUserClaims(uid, { role });
        }

        if (phone) {
        await admin.auth().updateUser(uid, {
            phoneNumber: phone.startsWith("+") ? phone : `+34${phone}`,
        });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error en Firebase Admin:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}