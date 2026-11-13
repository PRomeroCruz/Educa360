"use client";

import { useRouter } from "next/navigation";

export default function AccessDeniedPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 relative overflow-hidden antialiased">
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-56 h-56 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-rose-900/40 mb-4">
                    !
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Acceso Restringido (403)
                </h1>
                <p className="text-xs font-mono text-slate-400 mt-1.5 tracking-wide">
                    Educa360 · Protocolo de Seguridad Institucional
                </p>
            </div>

            <div className="bg-[#f8fafc] rounded-[28px] shadow-2xl max-w-[440px] w-full p-8 sm:p-10 text-center relative z-10 space-y-5">
                <div className="space-y-2">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        Privilegios Insuficientes
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Su cuenta no cuenta con los permisos necesarios para acceder a esta sección o portal clínico restringido.
                    </p>
                </div>

                <div className="pt-2">
                    <button
                        onClick={() => router.back()}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                    >
                        Volver a la página anterior
                    </button>
                </div>
            </div>

            <p className="text-[10px] font-mono text-slate-500 mt-8 text-center relative z-10">
                Entorno protegido con cifrado TLS 1.3 · Auditoría de seguridad activa
            </p>
        </main>
    );
}