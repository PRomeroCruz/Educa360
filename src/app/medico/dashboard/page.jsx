"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { Tarjeta } from "@/components/ComponentesUI";
import { EstadoCargando } from "@/components/EstadosUI";
import { registrarLogSistema } from "@/app/admin/dashboard/page";

export default function MedicoDashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthGuard("profesional_sanitario, medico");

    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "success" });

    const [modalAnularAbierto, setModalAnularAbierto] = useState(false);
    const [citaParaAnular, setCitaParaAnular] = useState(null);

    const [citasDiagnosticando, setCitasDiagnosticando] = useState({});
    const [textosDiagnostico, setTextosDiagnostico] = useState({});

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);

        try {
            const guardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
            setCitas(guardadas);
        } catch {
            setCitas([]);
        }

        if (!authLoading) {
            setLoading(false);
            clearTimeout(timer);
        }

        return () => clearTimeout(timer);
    }, [authLoading]);

    const actualizarEstadoCita = (citaId, nuevoEstado) => {
        const actualizadas = citas.map((c) => {
            if (c.id === citaId) {
                return { ...c, estado: nuevoEstado };
            }
            return c;
        });

        setCitas(actualizadas);
        localStorage.setItem("citas_educa360", JSON.stringify(actualizadas));

        registrarLogSistema(
            "VALIDACIÓN",
            user?.email || "medico@educa360.test",
            `Consulta médica marcada como "${nuevoEstado}" para el paciente.`
        );

        setMensaje({
            texto: `La cita ha sido marcada como: ${nuevoEstado}`,
            tipo: nuevoEstado === "Cancelada" ? "error" : "success"
        });

        setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
    };

    const toggleDesplegableDiagnostico = (citaId) => {
        setCitasDiagnosticando(prev => ({
            ...prev,
            [citaId]: !prev[citaId]
        }));
    };

    const guardarDiagnostico = (cita) => {
        const textoDiagnostico = textosDiagnostico[cita.id];
        if (!textoDiagnostico || !textoDiagnostico.trim()) return;

        const actualizadas = citas.map((c) => {
            if (c.id === cita.id) {
                return { 
                    ...c, 
                    diagnostico: textoDiagnostico.trim(),
                    estado: "Completada" 
                };
            }
            return c;
        });

        setCitas(actualizadas);
        localStorage.setItem("citas_educa360", JSON.stringify(actualizadas));

        const historialesPaciente = JSON.parse(localStorage.getItem(`diagnosticos_${cita.userEmail}`) || "[]");
        const nuevoRegistro = {
            id: Date.now(),
            fecha: new Date().toISOString().split("T")[0],
            especialidad: cita.especialidad,
            medico: user?.email || cita.medico,
            diagnostico: textoDiagnostico.trim()
        };
        localStorage.setItem(`diagnosticos_${cita.userEmail}`, JSON.stringify([nuevoRegistro, ...historialesPaciente]));

        registrarLogSistema(
            "DIAGNÓSTICO",
            user?.email || "medico@educa360.test",
            `Diagnóstico emitido para el paciente ${cita.userEmail}: ${textoDiagnostico.trim()}`
        );

        setMensaje({
            texto: `Diagnóstico guardado correctamente y enviado al historial clínico del paciente.`,
            tipo: "success"
        });

        setCitasDiagnosticando(prev => ({ ...prev, [cita.id]: false }));
        setTextosDiagnostico(prev => ({ ...prev, [cita.id]: "" }));
        setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
    };

    const abrirModalAnular = (cita) => {
        setCitaParaAnular(cita);
        setModalAnularAbierto(true);
    };

    const confirmarAnulacion = () => {
        if (!citaParaAnular) return;
        actualizarEstadoCita(citaParaAnular.id, "Cancelada");
        setModalAnularAbierto(false);
        setCitaParaAnular(null);
    };

    const handleCerrarSesion = async () => {
        registrarLogSistema("AUTENTICACIÓN", user?.email || "medico@educa360.test", "Cierre de sesión seguro desde portal médico.");
        await signOut(auth);
        router.push("/login");
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <EstadoCargando mensaje="Cargando panel del profesional sanitario..." />
            </div>
        );
    }

    const emailMedicoActual = (user?.email || "").toLowerCase();

    const citasDelMedicoAceptadas = citas.filter((c) => {
        const medicoCita = (c.medico || "").toLowerCase();
        const estadoCita = (c.estado || "").toLowerCase();

        const esDelMedico = medicoCita === emailMedicoActual || medicoCita.includes("medico");
        const esAceptada = estadoCita === "aceptada" || estadoCita === "confirmada";

        return esDelMedico && esAceptada;
    });

    return (
        <PortalShell
            rolLabel="Portal Médico"
            rolTipo="medico"
            usuarioNombre="Personal Sanitario"
            usuarioEmail={user?.email || "medico@educa360.test"}
            onLogout={handleCerrarSesion}
        >
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                                Área Clínica Asistencial
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 bg-slate-100">
                                TLS 1.3 Seguro
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
                            Panel de Consultas y Pacientes
                        </h1>
                        <p className="text-xs text-slate-500">
                            Gestión de agenda activa, historiales médicos y emisión de diagnósticos certificados.
                        </p>
                    </div>
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
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold relative z-10">Citas Aceptadas</span>
                        <p className="text-3xl font-extrabold text-slate-900 relative z-10">{citasDelMedicoAceptadas.length}</p>
                        <p className="text-[11px] text-teal-700 font-medium relative z-10">Sincronizadas en tiempo real</p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-60"></div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold relative z-10">Estado de Seguridad</span>
                        <div className="flex items-center gap-2 pt-0.5 relative z-10">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-xl font-bold text-emerald-700">2FA Activo</p>
                        </div>
                        <p className="text-[11px] text-slate-500 relative z-10">Cumplimiento ISO-27001</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-60"></div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold relative z-10">Sede Asignada</span>
                        <p className="text-base font-bold text-slate-900 truncate relative z-10 pt-0.5">Centro Sanitario Centro</p>
                        <p className="text-[11px] text-slate-500 relative z-10">Madrid · España</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                Agenda Activa · Consultas Aceptadas
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Listado exclusivo de citas confirmadas con opción de desplegar el panel de diagnóstico clínico.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {citasDelMedicoAceptadas.length === 0 ? (
                            <div className="py-16 text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <p className="text-xs font-bold text-slate-700">No hay consultas aceptadas pendientes</p>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    Las nuevas citas aceptadas aparecerán automáticamente en esta sección.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                        <th className="py-3 px-6 font-semibold">Paciente</th>
                                        <th className="py-3 px-4 font-semibold">Especialidad</th>
                                        <th className="py-3 px-4 font-semibold">Fecha y Hora</th>
                                        <th className="py-3 px-4 font-semibold">Motivo de Consulta</th>
                                        <th className="py-3 px-4 font-semibold">Estado</th>
                                        <th className="py-3 px-6 font-semibold text-right">Acciones Clínicas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {citasDelMedicoAceptadas.map((cita) => {
                                        const estaDiagnosticando = citasDiagnosticando[cita.id];

                                        return (
                                            <Fragment key={cita.id}>
                                                <tr className="hover:bg-slate-50/50 transition align-top">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                                                {(cita.userEmail || "P").charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                                                                    {cita.userEmail}
                                                                </span>
                                                                <span className="text-[10px] font-mono text-slate-400">Paciente Verificado</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-4 px-4 text-slate-700 font-medium">
                                                        {cita.especialidad}
                                                    </td>

                                                    <td className="py-4 px-4 whitespace-nowrap">
                                                        <div className="font-mono text-slate-800 font-semibold">{cita.fecha}</div>
                                                        <div className="font-mono text-teal-700 text-[11px]">{cita.hora}</div>
                                                    </td>

                                                    <td className="py-4 px-4 text-slate-600 max-w-[220px]">
                                                        {cita.motivo || "Sin observaciones"}
                                                    </td>

                                                    <td className="py-4 px-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                            {cita.estado}
                                                        </span>
                                                    </td>

                                                    <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                                                        <button
                                                            onClick={() => toggleDesplegableDiagnostico(cita.id)}
                                                            className={`px-3 py-2 font-bold text-xs rounded-xl transition cursor-pointer shadow-xs ${
                                                                estaDiagnosticando 
                                                                    ? "bg-teal-700 text-white shadow-teal-700/20" 
                                                                    : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20"
                                                            }`}
                                                        >
                                                            {estaDiagnosticando ? "Cerrar Panel" : "Diagnosticar"}
                                                        </button>
                                                        <button
                                                            onClick={() => abrirModalAnular(cita)}
                                                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer shadow-xs"
                                                        >
                                                            Anular
                                                        </button>
                                                    </td>
                                                </tr>

                                                {estaDiagnosticando && (
                                                    <tr className="bg-teal-50/40 border-b border-teal-100">
                                                        <td colSpan={6} className="p-5 px-6">
                                                            <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-bold text-teal-900 flex items-center gap-2">
                                                                        <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                                                                        Emisión de Dictamen y Diagnóstico Clínico
                                                                    </span>
                                                                    <span className="text-[10px] font-mono text-slate-400">Paciente: {cita.userEmail}</span>
                                                                </div>

                                                                {cita.diagnostico && (
                                                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                                                                        <strong>Último diagnóstico guardado:</strong> {cita.diagnostico}
                                                                    </div>
                                                                )}

                                                                <div className="space-y-1.5">
                                                                    <textarea
                                                                        rows={3}
                                                                        placeholder="Escriba aquí el diagnóstico detallado, observaciones y pautas de tratamiento..."
                                                                        value={textosDiagnostico[cita.id] || ""}
                                                                        onChange={(e) => setTextosDiagnostico({ ...textosDiagnostico, [cita.id]: e.target.value })}
                                                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition"
                                                                    />
                                                                </div>

                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => toggleDesplegableDiagnostico(cita.id)}
                                                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-200"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => guardarDiagnostico(cita)}
                                                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20"
                                                                    >
                                                                        Guardar y Enviar Diagnóstico
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {modalAnularAbierto && citaParaAnular && (
                    <div className="fixed inset-0 bg-[#090d16]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[28px] shadow-2xl border border-rose-100 max-w-[440px] w-full p-8 sm:p-10 space-y-6 text-center relative z-10">
                            
                            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm shrink-0 bg-rose-50 text-rose-600 border-rose-200">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-md font-bold">
                                    Acción Crítica
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight pt-1">
                                    ¿Desea anular esta consulta médica aceptada?
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed px-2">
                                    Está a punto de anular la cita del paciente <strong className="text-slate-700">{citaParaAnular.userEmail}</strong> programada para el <strong className="text-slate-700">{citaParaAnular.fecha}</strong> a las <strong className="text-slate-700">{citaParaAnular.hora}</strong>.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setModalAnularAbierto(false);
                                        setCitaParaAnular(null);
                                    }}
                                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200/80 shadow-xs cursor-pointer"
                                >
                                    Volver
                                </button>
                                <button
                                    onClick={confirmarAnulacion}
                                    className="w-full py-3.5 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                                >
                                    Sí, anular cita
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PortalShell>
    );
}