"use client";

import { useAuthGuard } from "@/lib/useAuthGuard";

export default function AlumnoLayout({ children }) {
    const { loading } = useAuthGuard("alumno_practicas, alumno");

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
                <p className="text-xs font-medium animate-pulse">Verificando acceso a zona de prácticas...</p>
            </div>
        );
    }

    return <>{children}</>;
}