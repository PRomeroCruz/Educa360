"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { Tarjeta } from "@/components/ComponentesUI";
import { EstadoCargando } from "@/components/EstadosUI";

export function registrarLogSistema(tipo, usuario, detalle) {
    try {
        const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
        
        const ahora = new Date();
        const fechaFormateada = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')} ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;

        const nuevoLog = {
            id: Date.now(),
            fecha: fechaFormateada,
            tipo: tipo.toUpperCase(),
            usuario: usuario || "sistema@educa360.test",
            detalle: detalle
        };

        const logsActualizados = [nuevoLog, ...logsActuales];
        localStorage.setItem("logs_educa360", JSON.stringify(logsActualizados));
    } catch (error) {
        console.error("Error al registrar el log del sistema:", error);
    }
}

export default function AdminLogsDashboardPage() {
    const router = useRouter();
    const { user, loading: authGuardLoading } = useAuthGuard("admin");

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [modalVaciarAbierto, setModalVaciarAbierto] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);

        try {
            const logsGuardados = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
            
            if (!Array.isArray(logsGuardados) || logsGuardados.length === 0) {
                const logsOriginales = [
                    { id: 1, fecha: "2026-11-13 09:15:22", tipo: "AUTENTICACIÓN", usuario: "adminsistema@educa360.test", detalle: "Inicio de sesión exitoso en Registro de Logs del Sistema." },
                    { id: 2, fecha: "2026-11-13 09:12:04", tipo: "VALIDACIÓN", usuario: "administracion@educa360.test", detalle: "Cita médica aceptada para paciente@educa360.test." },
                    { id: 3, fecha: "2026-11-12 16:45:10", tipo: "SEGURIDAD", usuario: "medico@educa360.test", detalle: "Configuración de doble factor de autenticación (2FA) completada." },
                    { id: 4, fecha: "2026-11-12 14:30:00", tipo: "REGISTRO", usuario: "paciente23@educa360.test", detalle: "Nuevo registro de paciente y envío de correo de verificación." },
                    { id: 5, fecha: "2026-11-11 11:20:55", tipo: "SISTEMA", usuario: "sistema@educa360.test", detalle: "Respaldo automático de base de datos cifrado (TLS 1.3)." }
                ];
                localStorage.setItem("logs_educa360", JSON.stringify(logsOriginales));
                setLogs(logsOriginales);
            } else {
                setLogs(logsGuardados);
            }
        } catch (error) {
            console.error("Error cargando logs:", error);
            setLogs([]);
        }

        if (!authGuardLoading) {
            setLoading(false);
            clearTimeout(timer);
        }

        return () => clearTimeout(timer);
    }, [authGuardLoading]);

    const handleCerrarSesion = async () => {
        registrarLogSistema("AUTENTICACIÓN", user?.email || "adminsistema@educa360.test", "Cierre de sesión seguro realizado desde el panel de administración.");
        await signOut(auth);
        router.push("/login");
    };

    const logsFiltrados = filtroTipo === "todos" 
        ? logs 
        : logs.filter(l => (l?.tipo || "").trim().toLowerCase() === filtroTipo.trim().toLowerCase());

    const ejecutarVaciadoLogs = () => {
        localStorage.setItem("logs_educa360", JSON.stringify([]));
        setLogs([]);
        setModalVaciarAbierto(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <EstadoCargando mensaje="Cargando registro de auditoría del sistema..." />
            </div>
        );
    }

    return (
        <PortalShell
            rolLabel="Administración del Sistema"
            rolTipo="admin"
            usuarioNombre="Administrador de Sistemas"
            usuarioEmail={user?.email || "adminsistema@educa360.test"}
            onLogout={handleCerrarSesion}
        >
            <div className="space-y-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                            Trazabilidad y Seguridad
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                            Registro de Logs del Sistema (ADMIN)
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Auditoría en tiempo real de eventos de acceso, validaciones clínicas y seguridad institucional
                        </p>
                    </div>

                    <button
                        onClick={() => setModalVaciarAbierto(true)}
                        className="px-4 py-2.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-200/80 hover:border-rose-200 shadow-xs transition cursor-pointer self-start sm:self-auto"
                    >
                        Vaciar registro
                    </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {["todos", "autenticación", "validación", "seguridad", "registro", "sistema"].map((tipo) => (
                        <button
                            key={tipo}
                            onClick={() => setFiltroTipo(tipo)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer border ${
                                filtroTipo === tipo
                                    ? "bg-[#009688] text-white border-teal-600 shadow-sm"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                        >
                            {tipo}
                        </button>
                    ))}
                </div>

                <Tarjeta
                    titulo="Historial de Eventos Registrados"
                    subtitulo={`Mostrando ${logsFiltrados.length} registros protegidos bajo cifrado institucional`}
                >
                    <div className="overflow-x-auto pt-2">
                        {logsFiltrados.length === 0 ? (
                            <div className="py-12 px-4 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 my-4">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#009688] border border-teal-100 flex items-center justify-center mx-auto text-sm font-bold shadow-xs">
                                    i
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-800">No hay registros de auditoría disponibles</p>
                                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                                        Actualmente el sistema no registra eventos bajo este criterio o el registro se encuentra vacío.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                        <th className="pb-3 font-semibold">Marca Temporal</th>
                                        <th className="pb-3 font-semibold">Tipo de Evento</th>
                                        <th className="pb-3 font-semibold">Usuario / Entidad</th>
                                        <th className="pb-3 font-semibold">Detalle de la Operación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                    {logsFiltrados.map((log, index) => {
                                        const tipoLower = (log?.tipo || "").toLowerCase();
                                        
                                        let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                                        if (tipoLower.includes("seguridad")) {
                                            badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                                        } else if (tipoLower.includes("validación")) {
                                            badgeColor = "bg-teal-50 text-teal-700 border-teal-200";
                                        } else if (tipoLower.includes("autenticación")) {
                                            badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                                        } else if (tipoLower.includes("registro")) {
                                            badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
                                        } else if (tipoLower.includes("sistema")) {
                                            badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
                                        }

                                        return (
                                            <tr key={log?.id || index} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3.5 pr-3 text-slate-500 whitespace-nowrap">
                                                    {log?.fecha || "—"}
                                                </td>
                                                <td className="py-3.5 pr-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${badgeColor}`}>
                                                        {log?.tipo || "GENERAL"}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 pr-3 font-semibold text-slate-800">
                                                    {log?.usuario || "sistema@educa360.test"}
                                                </td>
                                                <td className="py-3.5 text-slate-600 font-sans text-xs">
                                                    {log?.detalle || "Sin detalles registrados"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Tarjeta>

                {modalVaciarAbierto && (
                    <div className="fixed inset-0 bg-[#090d16]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-[#f8fafc] rounded-[28px] shadow-2xl border border-slate-100 max-w-[440px] w-full p-8 sm:p-10 space-y-6 text-center relative z-10">
                            
                            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-xs shrink-0 bg-rose-50 text-rose-600 border-rose-100">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                    ¿Vaciar el registro de auditoría?
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed px-2">
                                    Esta acción eliminará permanentemente todo el historial de eventos registrados en el sistema. No se podrá recuperar.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => setModalVaciarAbierto(false)}
                                    className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200/80 shadow-xs cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={ejecutarVaciadoLogs}
                                    className="w-full py-3.5 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                                >
                                    Sí, vaciar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PortalShell>
    );
}