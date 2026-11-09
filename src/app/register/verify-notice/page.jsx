"use client";

import { useRouter } from "next/navigation";

export default function VerifyNoticePage() {
    const router = useRouter();

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md text-center">
            
            <div className="mb-4 text-yellow-600 text-5xl">⚠️</div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Usuario creado con éxito!
            </h1>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md text-sm mb-6 text-left space-y-2">
            <p className="text-black"><strong>Advertencia de sistema:</strong> Por favor, revisa la consola de Firebase para confirmar la correcta creación del perfil.</p>
            <p className="text-black">Hemos enviado un <strong>correo de verificación</strong> a tu bandeja de entrada. Debes pulsar en el enlace de ese correo para activar y marcar como verificado tu usuario antes de poder iniciar sesión.</p>
            </div>

            <button
            onClick={() => router.push("/login")}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
            Ir a Iniciar Sesión
            </button>

        </div>
        </main>
    );
}
