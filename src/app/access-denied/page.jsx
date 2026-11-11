"use client";

import { useRouter } from "next/navigation";

export default function AccesoDenegadoPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-slate-900">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-10 space-y-6 text-center">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center border border-rose-100 shadow-sm">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Acceso No Disponible</h2>
                    <p className="text-xs text-slate-500 leading-relaxed px-2">
                        Lo sentimos, este contenido no está disponible para tu cuenta o el recurso solicitado no existe.
                    </p>
                </div>

                <div className="pt-2">
                    <button
                        onClick={() => router.back()}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition"
                    >
                        Volver a la página anterior
                    </button>
                </div>
            </div>
        </main>
    );
}