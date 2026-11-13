"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { EstadoCargando } from "@/components/EstadosUI";
import { registrarLogSistema } from "@/app/admin/dashboard/page";

export default function HistorialPublicacionesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthGuard("editor");

    const [recursos, setRecursos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "success" });
    const [loading, setLoading] = useState(true);

    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [recursoSeleccionado, setRecursoSeleccionado] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 600);
        try {
            const guardados = JSON.parse(localStorage.getItem("recursos_educa360") || "[]");
            setRecursos(guardados);
        } catch {
            setRecursos([]);
        }

        if (!authLoading) {
            setLoading(false);
            clearTimeout(timer);
        }

        return () => clearTimeout(timer);
    }, [authLoading]);

    const abrirModalRetirar = (recurso) => {
        setRecursoSeleccionado(recurso);
        setModalEliminarAbierto(true);
    };

    const confirmarRetirada = () => {
        if (!recursoSeleccionado) return;

        const actualizados = recursos.filter((r) => r.id !== recursoSeleccionado.id);
        setRecursos(actualizados);
        localStorage.setItem("recursos_educa360", JSON.stringify(actualizados));

        registrarLogSistema(
            "GESTIÓN DOCUMENTAL",
            user?.email || "editor@educa360.test",
            `Recurso retirado del repositorio general: "${recursoSeleccionado.titulo}"`
        );

        setMensaje({
            texto: `El documento "${recursoSeleccionado.titulo}" ha sido retirado del repositorio`,
            tipo: "error"
        });

        setModalEliminarAbierto(false);
        setRecursoSeleccionado(null);
        setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
    };

    const handleCerrarSesion = async () => {
        registrarLogSistema(
            "AUTENTICACIÓN",
            user?.email || "editor@educa360.test",
            "Cierre de sesión seguro desde el historial del editor."
        );
        await signOut(auth);
        router.push("/login");
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <EstadoCargando mensaje="Cargando historial de publicaciones..." />
            </div>
        );
    }

    const recursosFiltrados = recursos.filter((rec) => {
        const coincideTexto =
            (rec.titulo || "").toLowerCase().includes(busqueda.toLowerCase()) ||
            (rec.autor || "").toLowerCase().includes(busqueda.toLowerCase());
        const coincideTipo = filtroTipo === "Todos" || rec.tipo === filtroTipo;
        return coincideTexto && coincideTipo;
    });

    return (
        <PortalShell
            rolLabel="Portal Editor de Contenidos"
            rolTipo="editor"
            usuarioNombre="Gestor Documental"
            usuarioEmail={user?.email || "editor@educa360.test"}
            onLogout={handleCerrarSesion}
        >
            <div className="space-y-6 max-w-7xl mx-auto pb-10 relative">
                
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                                Auditoría Documental
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 bg-slate-100">
                                Repositorio Sincronizado
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
                            Historial de Publicaciones
                        </h1>
                        <p className="text-xs text-slate-500">
                            Registro completo de guías clínicas, protocolos sanitarios y materiales subidos al portal.
                        </p>
                    </div>

                    <button
                        onClick={() => router.push("/editor/dashboard")}
                        className="px-5 py-3 bg-[#009688] hover:bg-[#00796b] text-white font-bold text-xs rounded-xl shadow-md shadow-teal-700/20 transition cursor-pointer shrink-0 self-start md:self-center"
                    >
                        + Publicar Nuevo Recurso
                    </button>
                </div>

                {mensaje.texto && (
                    <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center space-x-3 shadow-xs transition-all ${
                        mensaje.tipo === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                            mensaje.tipo === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                            {mensaje.tipo === "success" ? "✓" : "!"}
                        </div>
                        <span>{mensaje.texto}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -z-0 opacity-60"></div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold relative z-10">
                            Total Publicados
                        </span>
                        <p className="text-3xl font-extrabold text-slate-900 relative z-10">{recursos.length}</p>
                        <p className="text-[11px] text-teal-700 font-medium relative z-10">Documentos activos en el portal</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-60"></div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold relative z-10">
                            Guías y Protocolos
                        </span>
                        <p className="text-3xl font-extrabold text-slate-900 relative z-10">
                            {recursos.filter((r) => r.tipo === "Guía Clínica" || r.tipo === "Protocolo Sanitario").length}
                        </p>
                        <p className="text-[11px] text-slate-500 relative z-10">Documentación clínica validada</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-60"></div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold relative z-10">
                            Estado del Repositorio
                        </span>
                        <div className="flex items-center gap-2 pt-0.5 relative z-10">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-xl font-bold text-emerald-700">Operativo</p>
                        </div>
                        <p className="text-[11px] text-slate-500 relative z-10">Trazabilidad ISO-27001 activa</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                Listado de Recursos Subidos
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Consulte el estado de cada publicación o retire documentos obsoletos
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <input
                                type="text"
                                placeholder="Buscar por título o autor..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-600 transition w-full sm:w-56"
                            />
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-600 transition"
                            >
                                <option value="Todos">Todas las categorías</option>
                                <option value="Guía Clínica">Guía Clínica</option>
                                <option value="Protocolo Sanitario">Protocolo Sanitario</option>
                                <option value="Material Docente">Material Docente</option>
                                <option value="Aviso Institucional">Aviso Institucional</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {recursosFiltrados.length === 0 ? (
                            <div className="py-16 text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                </div>
                                <p className="text-xs font-bold text-slate-700">No se encontraron recursos publicados</p>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    {recursos.length === 0
                                        ? "Todavía no se ha subido ningún documento desde el Editor de Guías y Recursos"
                                        : "No hay coincidencias con los filtros aplicados"}
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                        <th className="py-3.5 px-6 font-semibold">Documento / Protocolo</th>
                                        <th className="py-3.5 px-4 font-semibold">Categoría</th>
                                        <th className="py-3.5 px-4 font-semibold">Publicado por</th>
                                        <th className="py-3.5 px-4 font-semibold">Fecha</th>
                                        <th className="py-3.5 px-4 font-semibold">Estado</th>
                                        <th className="py-3.5 px-6 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recursosFiltrados.map((rec) => (
                                        <tr key={rec.id} className="hover:bg-slate-50/60 transition align-middle">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 font-bold flex items-center justify-center text-xs shrink-0">
                                                        DOC
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block max-w-[260px] truncate">
                                                            {rec.titulo}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            ID: #{String(rec.id).slice(-6)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px]">
                                                    {rec.tipo}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-mono text-slate-600 text-[11px]">
                                                {rec.autor}
                                            </td>
                                            <td className="py-4 px-4 font-mono text-slate-600 whitespace-nowrap">
                                                {rec.fecha}
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    {rec.estado}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => abrirModalRetirar(rec)}
                                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-xl border border-rose-200 transition cursor-pointer shadow-xs"
                                                >
                                                    Retirar Recurso
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {modalEliminarAbierto && recursoSeleccionado && (
                    <div className="fixed inset-0 bg-[#090d16]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-[28px] shadow-2xl border border-rose-100 max-w-[440px] w-full p-8 space-y-6 text-center relative z-10">
                            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm bg-rose-50 text-rose-600 border-rose-200">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-md font-bold">
                                    Baja Documental
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight pt-1">
                                    ¿Retirar este recurso del portal?
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed px-2">
                                    El documento <strong className="text-slate-700">&ldquo;{recursoSeleccionado.titulo}&rdquo;</strong> dejará de estar visible para pacientes y facultativos.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setModalEliminarAbierto(false);
                                        setRecursoSeleccionado(null);
                                    }}
                                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200/80 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmarRetirada}
                                    className="w-full py-3.5 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                                >
                                    Sí, retirar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PortalShell>
    );
}