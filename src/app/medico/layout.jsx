"use client";

import { useAuthGuard } from "@/lib/useAuthGuard";

export default function MedicoLayout({ children }) {
    const { loading } = useAuthGuard("profesional_sanitario, medico");

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-800">
                <p className="text-xs font-medium animate-pulse">Verificando credenciales de profesional sanitario...</p>
            </div>
        );
    }

    return <>{children}</>;
}