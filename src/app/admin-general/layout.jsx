"use client";

import { useAuthGuard } from "@/lib/useAuthGuard";

export default function AdminGeneralLayout({ children }) {
    const { loading } = useAuthGuard("admin, administración");

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
                <p className="text-xs font-medium animate-pulse">Cargando panel de administración general...</p>
            </div>
        );
    }

    return <>{children}</>;
}