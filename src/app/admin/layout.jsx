"use client";

import { useAuthGuard } from "@/lib/useAuthGuard";

export default function AdminSistemaLayout({ children }) {
    const { loading } = useAuthGuard("admin_sistema, admin");

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
                <p className="text-xs font-medium animate-pulse">Verificando privilegios del sistema...</p>
            </div>
        );
    }

    return <>{children}</>;
}