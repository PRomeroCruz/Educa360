"use client";

import { useAuthGuard } from "@/lib/useAuthGuard";

export default function PacienteLayout({ children }) {
    const { loading } = useAuthGuard("paciente, admin");

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
                <p className="text-xs font-medium animate-pulse">Cargando portal de paciente...</p>
            </div>
        );
    }

    return <>{children}</>;
}