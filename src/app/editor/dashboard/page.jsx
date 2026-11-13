"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { Tarjeta, Campo, Boton, Aviso } from "@/components/ComponentesUI";
import { EstadoCargando } from "@/components/EstadosUI";

export default function EditorDashboard() {
    const router = useRouter();
    const { user, loading } = useAuthGuard("editor_contenidos,editor");
    const [tituloRecurso, setTituloRecurso] = useState("");
    const [mensaje, setMensaje] = useState("");

    const handlePublicar = (e) => {
        e.preventDefault();
        if (!tituloRecurso) return;
        setMensaje(`Recurso "${tituloRecurso}" publicado con éxito en el portal.`);
        setTituloRecurso("");
        setTimeout(() => setMensaje(""), 3000);
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <EstadoCargando mensaje="Cargando gestor de contenidos..." />
        </div>
        );
    }

    return (
        <PortalShell
        rolLabel="Editor de Contenidos"
        usuarioNombre="Sofia Editora"
        usuarioEmail={user?.email || "editor@educa360.test"}
        onLogout={handleLogout}
        >
        <div className="space-y-6">
            <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                Gestión Documental
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Editor de Recursos y Guías Clínicas</h1>
            <p className="text-xs text-slate-500 mt-0.5">
                Publica guías informativas y protocolos médicos a disposición de los pacientes y sanitarios.
            </p>
            </div>

            {mensaje && <Aviso tipo="info">{mensaje}</Aviso>}

            <Tarjeta titulo="Publicar Nuevo Recurso" subtitulo="Añadir documentación al repositorio general.">
            <form onSubmit={handlePublicar} className="space-y-4 max-w-lg">
                <Campo
                id="titulo-recurso"
                label="Título del documento o protocolo"
                placeholder="Ej. Protocolo de atención cardiológica 2026"
                value={tituloRecurso}
                onChange={(e) => setTituloRecurso(e.target.value)}
                />
                <Boton type="submit">Publicar recurso</Boton>
            </form>
            </Tarjeta>
        </div>
        </PortalShell>
    );
}