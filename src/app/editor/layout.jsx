"use client";

import { useAuthGuard } from "@/lib/useAuthGuard";

export default function EditorLayout({ children }) {
    const { loading } = useAuthGuard("editor_contenidos, editor");

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
                <p className="text-xs font-medium animate-pulse">Cargando gestor de contenidos...</p>
            </div>
        );
    }

    return <>{children}</>;
}