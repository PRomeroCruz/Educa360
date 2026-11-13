"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { Tarjeta } from "@/components/ComponentesUI";
import { EstadoCargando } from "@/components/EstadosUI";
import { registrarLogSistema } from "@/app/admin/dashboard/page";

export default function EditorDashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthGuard("editor");

    const [tituloRecurso, setTituloRecurso] = useState("");
    const [tipoRecurso, setTipoRecurso] = useState("Guía Clínica");
    const [totalPublicados, setTotalPublicados] = useState(0);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "success" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 600);
        try {
            const guardados = JSON.parse(localStorage.getItem("recursos_educa360") || "[]");
            setTotalPublicados(guardados.length);
        } catch {
            setTotalPublicados(0);
        }

        if (!authLoading) {
            setLoading(false);
            clearTimeout(timer);
        }

        return () => clearTimeout(timer);
    }, [authLoading]);

    const handlePublicarRecurso = (e) => {
        e.preventDefault();
        if (!tituloRecurso.trim()) return;

        const guardados = JSON.parse(localStorage.getItem("recursos_educa360") || "[]");
        const nuevoRecurso = {
            id: Date.now(),
            titulo: tituloRecurso.trim(),
            tipo: tipoRecurso,
            fecha: new Date().toISOString().split("T")[0],
            autor: user?.email || "editor@educa360.test",
            estado: "Publicado y Activo"
        };

        const actualizados = [nuevoRecurso, ...guardados];
        localStorage.setItem("recursos_educa360", JSON.stringify(actualizados));
        setTotalPublicados(actualizados.length);

        registrarLogSistema(
            "GESTIÓN DOCUMENTAL",
            user?.email || "editor@educa360.test",
            `Publicación de nuevo recurso clínico/docente: "${tituloRecurso.trim()}" (${tipoRecurso})`
        );

        setMensaje({
            texto: `El recurso "${tituloRecurso.trim()}" se ha publicado correctamente`,
            tipo: "success"
        });

        setTituloRecurso("");
        setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
    };

    const handleCerrarSesion = async () => {
        registrarLogSistema("AUTENTICACIÓN", user?.email || "editor@educa360.test", "Cierre de sesión seguro desde portal editor");
        await signOut(auth);
        router.push("/login");
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <EstadoCargando mensaje="Cargando panel de gestión documental..." />
            </div>
        );
    }

    return (
        <PortalShell
            rolLabel="Portal Editor de Contenidos"
            rolTipo="editor"
            usuarioNombre="Gestor Documental"
            usuarioEmail={user?.email || "editor@educa360.test"}
            onLogout={handleCerrarSesion}
        >
            <div className="space-y-6 max-w-6xl mx-auto pb-10">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                            Gestión Documental
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 bg-slate-100">
                            Repositorio Global
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
                        Editor de Recursos y Guías Clínicas
                    </h1>
                    <p className="text-xs text-slate-500">
                        Publica guías informativas, protocolos médicos y material docente a disposición de pacientes y sanitarios
                    </p>
                </div>

                {mensaje.texto && (
                    <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                                ✓
                            </div>
                            <span>{mensaje.texto}</span>
                        </div>
                    </div>
                )}

                <Tarjeta
                    titulo="Publicar Nuevo Recurso"
                    subtitulo="Añadir documentación oficial al repositorio general de Educa360"
                >
                    <form onSubmit={handlePublicarRecurso} className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Título del Documento o Protocolo</label>
                                <input
                                    type="text"
                                    required
                                    value={tituloRecurso}
                                    onChange={(e) => setTituloRecurso(e.target.value)}
                                    placeholder="Ej. Protocolo de atención cardiológica 2026"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Tipo de Recurso</label>
                                <select
                                    value={tipoRecurso}
                                    onChange={(e) => setTipoRecurso(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-teal-600 transition"
                                >
                                    <option value="Guía Clínica">Guía Clínica</option>
                                    <option value="Protocolo Sanitario">Protocolo Sanitario</option>
                                    <option value="Material Docente">Material Docente</option>
                                    <option value="Aviso Institucional">Aviso Institucional</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-[#090d16] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                            >
                                Publicar Recurso en Repositorio
                            </button>
                        </div>
                    </form>
                </Tarjeta>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 font-bold bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                            Historial de Publicaciones ({totalPublicados})
                        </span>
                        <h2 className="text-sm font-bold text-slate-900 pt-1">
                            Consultar los cambios y documentos publicados
                        </h2>
                        <p className="text-xs text-slate-500">
                            Acceda al subapartado de Historial de Publicaciones en el menú lateral para auditar o retirar recursos.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/editor/historial")}
                        className="px-5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                    >
                        Ir a Historial de Publicaciones
                    </button>
                </div>
            </div>
        </PortalShell>
    );
}