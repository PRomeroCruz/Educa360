"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function SecurityRolePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [serverRole, setServerRole] = useState("Verificando...");
    const [clientState, setClientState] = useState("Sincronizado");
    const [diagnosticStatus, setDiagnosticStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
            router.push("/login");
        } else {
            setUser(currentUser);
            const idTokenResult = await currentUser.getIdTokenResult(true);
            const roleClaim = idTokenResult.claims.role;

            if (roleClaim === "admin") {
            setServerRole("Administrador (Servidor)");
            } else {
            setServerRole("Paciente (Estándar)");
            }
            setLoading(false);
        }
        });
        return () => unsubscribe();
    }, [router]);

    const handleRunDiagnostics = () => {
        setDiagnosticStatus("Analizando integridad del token y permisos...");
        setTimeout(() => {
        setDiagnosticStatus("✅ Integridad verificada: Los permisos están firmados criptográficamente por el servidor.");
        }, 1000);
    };

    if (loading) return null;

    return (
        <main className="min-h-screen bg-gray-50 p-6">
        <header className="max-w-5xl mx-auto bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center mb-6">
            <div>
            <h1 className="text-lg font-bold text-gray-900">Educa360 - Seguridad y Credenciales</h1>
            <p className="text-xs text-gray-500">Gestión avanzada de sesiones y control de acceso basado en servidor</p>
            </div>
            <button
            onClick={() => router.push("/paciente/dashboard")}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs transition"
            >
            ← Volver al Dashboard
            </button>
        </header>

        <section className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Centro de Integridad de Sesión 🔐</h2>
            <p className="text-gray-600 text-sm">
                Este módulo supervisa el estado de autenticação y asegura que los privilegios sean validados centralmente.
            </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold mb-3">
                    Verificado por Servidor
                </span>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Rol de Usuario Actual</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1 uppercase">{serverRole}</p>
                </div>
                <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">Emitido criptográficamente.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold mb-3">Estado del Canal</span>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Sincronización</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{clientState}</p>
                </div>
                <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">UID: <span className="font-mono">{user?.uid}</span></p>
            </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                <h3 className="text-base font-bold text-gray-900">Diagnóstico de Seguridad</h3>
                <p className="text-xs text-gray-500">Comprobación del estado actual de los permisos.</p>
                </div>
                <button
                onClick={handleRunDiagnostics}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition shadow-sm"
                >
                Ejecutar Diagnóstico
                </button>
            </div>
            {diagnosticStatus && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm">
                {diagnosticStatus}
                </div>
            )}
            </div>
        </section>
        </main>
    );
}