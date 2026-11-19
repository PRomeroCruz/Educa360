"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { EstadoCargando } from "@/components/EstadosUI";
import { registrarLogSistema } from "@/app/admin/dashboard/page";

const LONGITUD_MINIMA_MOTIVO = 10;

export function tieneRelacionAsistencial(cita, emailMedicoActual) {
    if (!cita) return false;
    const medicoCita = (cita.medico || "").trim().toLowerCase();
    const medicoActual = (emailMedicoActual || "").trim().toLowerCase();
    const estadoCita = (cita.estado || "").trim().toLowerCase();

    const tieneCitaActiva = estadoCita === "aceptada" || estadoCita === "confirmada";
    const esSuPaciente = Boolean(medicoCita && medicoActual && medicoCita === medicoActual);

    return tieneCitaActiva && esSuPaciente;
}

export function registrarAccesoExcepcional({
    pacienteEmail,
    medicoEmail,
    especialidad = "Consulta Clínica",
    motivo,
    origen = "UI_PANEL_MEDICO",
}) {
    const motivoLimpio = (motivo || "").trim();
    if (motivoLimpio.length < LONGITUD_MINIMA_MOTIVO) {
        return {
            ok: false,
            error: `El motivo debe tener al menos ${LONGITUD_MINIMA_MOTIVO} caracteres.`,
        };
    }

    const registroExcepcional = {
        id: Date.now(),
        tipo: "ACCESO_EXCEPCIONAL",
        excepcional: true,
        fechaHora: new Date().toISOString(),
        fecha: new Date().toISOString().split("T")[0],
        pacienteEmail: (pacienteEmail || "").trim(),
        medicoEmail: (medicoEmail || "medico@educa360.test").trim(),
        especialidad,
        motivo: motivoLimpio,
        origen,
    };

    try {
        const clavePaciente = `accesos_excepcionales_${registroExcepcional.pacienteEmail}`;
        const listaPaciente = JSON.parse(localStorage.getItem(clavePaciente) || "[]");
        localStorage.setItem(clavePaciente, JSON.stringify([registroExcepcional, ...listaPaciente]));

        const listaGlobal = JSON.parse(localStorage.getItem("accesos_excepcionales_educa360") || "[]");
        localStorage.setItem("accesos_excepcionales_educa360", JSON.stringify([registroExcepcional, ...listaGlobal]));
    } catch (err) {
        console.error("Error guardando acceso excepcional:", err);
    }

    console.log("==================================================");
    console.log(" [AUDITORÍA · ACCESO EXCEPCIONAL REGISTRADO] ");
    console.log(" Profesional:", registroExcepcional.medicoEmail);
    console.log(" Paciente:", registroExcepcional.pacienteEmail);
    console.log(" Especialidad:", registroExcepcional.especialidad);
    console.log(" Fecha/Hora:", registroExcepcional.fechaHora);
    console.log(" Motivo:", registroExcepcional.motivo);
    console.log(" Origen:", registroExcepcional.origen);
    console.log("==================================================");

    registrarLogSistema(
        "ACCESO_EXCEPCIONAL",
        registroExcepcional.medicoEmail,
        `[EXCEPCIONAL] Acceso sin relación asistencial previa a ${registroExcepcional.pacienteEmail} (${registroExcepcional.especialidad}). Motivo: "${registroExcepcional.motivo}".`
    );

    return { ok: true, registro: registroExcepcional };
}

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
    const [textosTratamiento, setTextosTratamiento] = useState({});

    const [solicitudesPruebas, setSolicitudesPruebas] = useState([]);
    const [nuevaPruebaPorCita, setNuevaPruebaPorCita] = useState({});

    const [citaAccesoExcepcional, setCitaAccesoExcepcional] = useState(null);
    const [motivoExcepcional, setMotivoExcepcional] = useState("");
    const [errorMotivo, setErrorMotivo] = useState("");
    const [accesosConcedidos, setAccesosConcedidos] = useState({});

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.registrarAccesoExcepcional = registrarAccesoExcepcional;
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);

        try {
            const guardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
            setCitas(guardadas);

            const pruebasGuardadas = JSON.parse(localStorage.getItem("solicitudes_pruebas_educa360") || "[]");
            setSolicitudesPruebas(pruebasGuardadas);

            const borradoresDiag = {};
            const borradoresTrat = {};
            guardadas.forEach((c) => {
                const borradorDiag = localStorage.getItem(`borrador_diag_${c.id}`);
                const borradorTrat = localStorage.getItem(`borrador_trat_${c.id}`);
                if (borradorDiag) borradoresDiag[c.id] = borradorDiag;
                if (borradorTrat) borradoresTrat[c.id] = borradorTrat;
            });
            setTextosDiagnostico(borradoresDiag);
            setTextosTratamiento(borradoresTrat);
        } catch {
            setCitas([]);
            setSolicitudesPruebas([]);
        }

        if (!authLoading) {
            setLoading(false);
            clearTimeout(timer);
        }

        return () => clearTimeout(timer);
    }, [authLoading]);

    const crearSolicitudPrueba = (cita) => {
        const form = nuevaPruebaPorCita[cita.id] || { tipoPrueba: "", indicaciones: "" };
        const tipoPrueba = (form.tipoPrueba || "").trim();
        const indicaciones = (form.indicaciones || "").trim();

        if (!tipoPrueba || !indicaciones) {
            setMensaje({
                texto: "Indique el tipo de prueba y las indicaciones clínicas para crear la solicitud.",
                tipo: "error",
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
            return;
        }

        const nuevaSolicitud = {
            id: Date.now(),
            citaId: cita.id,
            pacienteEmail: cita.userEmail,
            medicoEmail: user?.email || cita.medico || "medico@educa360.test",
            especialidad: cita.especialidad,
            fechaSolicitud: new Date().toISOString().split("T")[0],
            tipoPrueba,
            indicaciones,
            resultado: "",
            estado: "Solicitada",
        };

        const actualizadas = [nuevaSolicitud, ...solicitudesPruebas];
        setSolicitudesPruebas(actualizadas);
        localStorage.setItem("solicitudes_pruebas_educa360", JSON.stringify(actualizadas));

        setNuevaPruebaPorCita((prev) => ({
            ...prev,
            [cita.id]: { tipoPrueba: "", indicaciones: "" },
        }));

        setCitasDiagnosticando((prev) => ({ ...prev, [cita.id]: false }));
        window.scrollTo({ top: 0, behavior: "smooth" });

        registrarLogSistema(
            "PRUEBA_SOLICITADA",
            user?.email || "medico@educa360.test",
            `Solicitud de prueba "${tipoPrueba}" creada para ${cita.userEmail} (Estado: Solicitada).`
        );

        setMensaje({
            texto: `Solicitud de prueba "${tipoPrueba}" registrada en estado Solicitada.`,
            tipo: "success",
        });
        setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
    };

    const actualizarEstadoCita = (citaId, nuevoEstado) => {
        const actualizadas = citas.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c));
        setCitas(actualizadas);
        localStorage.setItem("citas_educa360", JSON.stringify(actualizadas));

        if (nuevoEstado === "No presentado") {
            localStorage.removeItem(`borrador_diag_${citaId}`);
            localStorage.removeItem(`borrador_trat_${citaId}`);
        }

        const esIncomparecencia = nuevoEstado === "No presentado";
        registrarLogSistema(
            "VALIDACIÓN",
            user?.email || "medico@educa360.test",
            `Consulta marcada como "${nuevoEstado}".${esIncomparecencia ? " El paciente no se ha presentado." : ""}`
        );

        setMensaje({
            texto: esIncomparecencia
                ? "El paciente no se ha presentado. La cita ha sido apartada de la agenda activa."
                : `La cita ha sido marcada como: ${nuevoEstado}`,
            tipo: esIncomparecencia || nuevoEstado === "Cancelada" ? "error" : "success",
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
    };

    const manejarClickAtender = (cita) => {
        if (citasDiagnosticando[cita.id]) {
            setCitasDiagnosticando((prev) => ({ ...prev, [cita.id]: false }));
            return;
        }

        const emailMedicoActual = user?.email || "medico@educa360.test";
        const tieneRelacion = tieneRelacionAsistencial(cita, emailMedicoActual);
        const yaAutorizado = Boolean(accesosConcedidos[cita.id]);

        if (!tieneRelacion && !yaAutorizado) {
            setCitaAccesoExcepcional(cita);
            setMotivoExcepcional("");
            setErrorMotivo("");
            return;
        }

        setCitasDiagnosticando((prev) => ({ ...prev, [cita.id]: true }));
    };

    const confirmarAccesoExcepcional = () => {
        if (!citaAccesoExcepcional) return;

        const motivoLimpio = motivoExcepcional.trim();
        if (motivoLimpio.length < LONGITUD_MINIMA_MOTIVO) {
            setErrorMotivo(
                `Debe indicar un motivo justificado de al menos ${LONGITUD_MINIMA_MOTIVO} caracteres (actual: ${motivoLimpio.length}).`
            );
            return;
        }

        const resultado = registrarAccesoExcepcional({
            pacienteEmail: citaAccesoExcepcional.userEmail,
            medicoEmail: user?.email || "medico@educa360.test",
            especialidad: citaAccesoExcepcional.especialidad,
            motivo: motivoLimpio,
            origen: "PANEL_MEDICO_ATENDER",
        });

        if (!resultado.ok) {
            setErrorMotivo(resultado.error);
            return;
        }

        const citaId = citaAccesoExcepcional.id;
        setAccesosConcedidos((prev) => ({ ...prev, [citaId]: true }));
        setCitasDiagnosticando((prev) => ({ ...prev, [citaId]: true }));
        setCitaAccesoExcepcional(null);
        setMotivoExcepcional("");
        setErrorMotivo("");

        setMensaje({
            texto: `Acceso excepcional registrado para ${citaAccesoExcepcional.userEmail}. El motivo queda visible en auditoría y en el portal del paciente.`,
            tipo: "success",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 5000);
    };

    const guardarBorrador = (cita) => {
        const diag = textosDiagnostico[cita.id] || "";
        const trat = textosTratamiento[cita.id] || "";

        localStorage.setItem(`borrador_diag_${cita.id}`, diag);
        localStorage.setItem(`borrador_trat_${cita.id}`, trat);

        registrarLogSistema(
            "BORRADOR",
            user?.email || "medico@educa360.test",
            `Acto clínico guardado en borrador para ${cita.userEmail}`
        );
        setMensaje({ texto: "Borrador del acto clínico guardado correctamente (Privado).", tipo: "success" });

        setCitasDiagnosticando((prev) => ({ ...prev, [cita.id]: false }));
        window.scrollTo({ top: 0, behavior: "smooth" });

        setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
    };

    const guardarDiagnostico = (cita) => {
        const diag = textosDiagnostico[cita.id] || "";
        const trat = textosTratamiento[cita.id] || "";
        if (!diag.trim()) return;

        const actualizadas = citas.map((c) => {
            if (c.id === cita.id) {
                return {
                    ...c,
                    diagnostico: diag.trim(),
                    tratamiento: trat.trim(),
                    estado: "Completada",
                };
            }
            return c;
        });

        setCitas(actualizadas);
        localStorage.setItem("citas_educa360", JSON.stringify(actualizadas));
        localStorage.removeItem(`borrador_diag_${cita.id}`);
        localStorage.removeItem(`borrador_trat_${cita.id}`);

        const historialesPaciente = JSON.parse(localStorage.getItem(`diagnosticos_${cita.userEmail}`) || "[]");
        const nuevoRegistro = {
            id: Date.now(),
            fecha: new Date().toISOString().split("T")[0],
            especialidad: cita.especialidad,
            medico: user?.email || cita.medico,
            diagnostico: diag.trim(),
            tratamiento: trat.trim(),
        };
        localStorage.setItem(`diagnosticos_${cita.userEmail}`, JSON.stringify([nuevoRegistro, ...historialesPaciente]));

        registrarLogSistema(
            "DIAGNÓSTICO",
            user?.email || "medico@educa360.test",
            `Diagnóstico firmado y publicado para ${cita.userEmail}`
        );
        setMensaje({ texto: "Acto clínico firmado y publicado correctamente en el expediente del paciente.", tipo: "success" });

        setCitasDiagnosticando((prev) => ({ ...prev, [cita.id]: false }));
        window.scrollTo({ top: 0, behavior: "smooth" });
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
        await signOut(auth);
        router.push("/login");
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <EstadoCargando mensaje="Cargando panel médico..." />
            </div>
        );
    }

    const emailMedicoActual = (user?.email || "").toLowerCase();
    const citasDelMedicoAceptadas = citas.filter((c) => {
        const medicoCita = (c.medico || "").toLowerCase();
        const estadoCita = (c.estado || "").toLowerCase();
        return (!medicoCita || medicoCita === emailMedicoActual || medicoCita.includes("medico")) && (estadoCita === "aceptada" || estadoCita === "confirmada");
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
                    <div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                            Área Clínica Asistencial
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
                            Panel de Consultas y Pacientes
                        </h1>
                        <p className="text-xs text-slate-500">
                            Gestión de agenda activa, relación asistencial, acceso excepcional justificado y actos clínicos.
                        </p>
                    </div>
                    <Link
                        href="/medico/profile"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                    >
                        Mi Ficha Profesional
                    </Link>
                </div>

                {mensaje.texto && (
                    <div
                        className={`p-4 rounded-2xl border text-xs font-medium flex items-center space-x-3 shadow-xs ${
                            mensaje.tipo === "success"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    >
                        <span>{mensaje.texto}</span>
                    </div>
                )}

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            Agenda Activa · Consultas Confirmadas
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        {citasDelMedicoAceptadas.length === 0 ? (
                            <div className="py-16 text-center space-y-2">
                                <p className="text-xs font-bold text-slate-700">No hay consultas confirmadas pendientes</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                        <th className="py-3 px-4 font-semibold">Paciente</th>
                                        <th className="py-3 px-3 font-semibold">Especialidad</th>
                                        <th className="py-3 px-3 font-semibold">Fecha y Hora</th>
                                        <th className="py-3 px-3 font-semibold">Motivo</th>
                                        <th className="py-3 px-3 font-semibold">Estado</th>
                                        <th className="py-3 px-4 font-semibold text-right">Acciones de Asistencia y Cita</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {citasDelMedicoAceptadas.map((cita) => {
                                        const estaDiagnosticando = citasDiagnosticando[cita.id];
                                        const tieneBorrador = Boolean(localStorage.getItem(`borrador_diag_${cita.id}`));
                                        const inicialPaciente = (cita.userEmail || "P").charAt(0).toUpperCase();
                                        const relacionDirecta = tieneRelacionAsistencial(cita, emailMedicoActual);
                                        const accesoExcepcionalActivo = Boolean(accesosConcedidos[cita.id]);
                                        const formPrueba = nuevaPruebaPorCita[cita.id] || {
                                            tipoPrueba: "",
                                            indicaciones: "",
                                        };

                                        return (
                                            <Fragment key={cita.id}>
                                                <tr className="hover:bg-slate-50/50 transition align-middle">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-9 h-9 rounded-xl bg-teal-50/80 border border-teal-200/80 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                                {inicialPaciente}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900 block">{cita.userEmail}</span>
                                                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                                    {relacionDirecta ? (
                                                                        <span className="inline-block text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 font-mono">
                                                                            Relación asistencial activa
                                                                        </span>
                                                                    ) : accesoExcepcionalActivo ? (
                                                                        <span className="inline-block text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-mono font-bold">
                                                                            Acceso excepcional registrado
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                                                            Sin relación asignada
                                                                        </span>
                                                                    )}
                                                                    {tieneBorrador && (
                                                                        <span className="inline-block text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold">
                                                                            Borrador Guardado
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-3 text-slate-700">{cita.especialidad}</td>
                                                    <td className="py-4 px-3 font-mono whitespace-nowrap">{cita.fecha} {cita.hora}</td>
                                                    <td className="py-4 px-3 text-slate-600">{cita.motivo}</td>
                                                    <td className="py-4 px-3">
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                                            CONFIRMADA
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                                            <button
                                                                onClick={() => manejarClickAtender(cita)}
                                                                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-xl transition cursor-pointer whitespace-nowrap shrink-0"
                                                            >
                                                                {estaDiagnosticando ? "Cerrar Panel" : "Atender"}
                                                            </button>
                                                            <button
                                                                onClick={() => actualizarEstadoCita(cita.id, "No presentado")}
                                                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-xl border border-rose-200 transition cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                                                            >
                                                                <span>✕ No asistió</span>
                                                            </button>
                                                            <button
                                                                onClick={() => abrirModalAnular(cita)}
                                                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
                                                            >
                                                                Anular
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {estaDiagnosticando && (
                                                    <tr className="bg-teal-50/40 border-b border-teal-100">
                                                        <td colSpan={6} className="p-5 px-6">
                                                            <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-5">
                                                                <span className="text-xs font-bold text-teal-900 block">
                                                                    Registro de Acto Clínico (Borrador Privado)
                                                                </span>

                                                                <div className="space-y-1">
                                                                    <label className="text-[11px] font-bold text-slate-700">
                                                                        Motivo, Exploración y Valoración Clínica
                                                                    </label>
                                                                    <textarea
                                                                        rows={3}
                                                                        placeholder="Escriba la exploración y valoración..."
                                                                        value={textosDiagnostico[cita.id] || ""}
                                                                        onChange={(e) =>
                                                                            setTextosDiagnostico({
                                                                                ...textosDiagnostico,
                                                                                [cita.id]: e.target.value,
                                                                            })
                                                                        }
                                                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-teal-600"
                                                                    />
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <label className="text-[11px] font-bold text-slate-700">
                                                                        Plan / Tratamiento Prescrito
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Ej: Paracetamol 1g cada 8h durante 5 días"
                                                                        value={textosTratamiento[cita.id] || ""}
                                                                        onChange={(e) =>
                                                                            setTextosTratamiento({
                                                                                ...textosTratamiento,
                                                                                [cita.id]: e.target.value,
                                                                            })
                                                                        }
                                                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-teal-600"
                                                                    />
                                                                </div>

                                                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono">
                                                                            Solicitar Prueba Complementaria desde Acto Clínico
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-500 font-mono">
                                                                            Estado inicial: Solicitada
                                                                        </span>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[11px] font-semibold text-slate-700">
                                                                                Tipo de prueba
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Ej: Analítica sanguínea completa, Radiografía de tórax..."
                                                                                value={formPrueba.tipoPrueba}
                                                                                onChange={(e) =>
                                                                                    setNuevaPruebaPorCita((prev) => ({
                                                                                        ...prev,
                                                                                        [cita.id]: {
                                                                                            ...formPrueba,
                                                                                            tipoPrueba: e.target.value,
                                                                                        },
                                                                                    }))
                                                                                }
                                                                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-teal-600"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[11px] font-semibold text-slate-700">
                                                                                Indicaciones clínicas
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Ej: En ayunas de 8h, valorar perfil hepático y PCR"
                                                                                value={formPrueba.indicaciones}
                                                                                onChange={(e) =>
                                                                                    setNuevaPruebaPorCita((prev) => ({
                                                                                        ...prev,
                                                                                        [cita.id]: {
                                                                                            ...formPrueba,
                                                                                            indicaciones: e.target.value,
                                                                                        },
                                                                                    }))
                                                                                }
                                                                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-teal-600"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex justify-end">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => crearSolicitudPrueba(cita)}
                                                                            className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl transition cursor-pointer"
                                                                        >
                                                                            + Registrar Solicitud de Prueba
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                                    <span className="text-[11px] text-slate-500 font-mono">
                                                                        Los borradores solo son visibles para el profesional sanitario.
                                                                    </span>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => guardarBorrador(cita)}
                                                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200 cursor-pointer"
                                                                        >
                                                                            Guardar Borrador
                                                                        </button>
                                                                        <button
                                                                            onClick={() => guardarDiagnostico(cita)}
                                                                            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
                                                                        >
                                                                            Firmar y Publicar al Paciente
                                                                        </button>
                                                                    </div>
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

                {citaAccesoExcepcional && (
                    <div className="fixed inset-0 bg-[#090d16]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[28px] shadow-2xl border border-amber-200 max-w-[480px] w-full p-8 space-y-5 relative z-10">
                            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>

                            <div className="space-y-2 text-center">
                                <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-md font-bold">
                                    Aviso Previo · Acceso Excepcional
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight pt-1">
                                    Atención sin relación asistencial asignada
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    No consta relación asistencial directa entre su usuario (
                                    <strong className="text-slate-800">{user?.email || "medico@educa360.test"}</strong>) y el paciente{" "}
                                    <strong className="text-slate-800">{citaAccesoExcepcional.userEmail}</strong>.
                                </p>
                                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left">
                                    <p className="text-[11px] text-amber-900 font-semibold">
                                        Aviso antes de continuar: este acceso quedará registrado de forma reforzada como ACCESO EXCEPCIONAL (quién accede, cuándo, sobre qué paciente y su motivo) y será visible para auditoría y para el paciente.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-bold text-slate-800">
                                    Motivo del acceso excepcional (obligatorio, mín. {LONGITUD_MINIMA_MOTIVO} caracteres)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Ej: Cobertura urgente por ausencia del facultativo asignado en consulta..."
                                    value={motivoExcepcional}
                                    onChange={(e) => {
                                        setMotivoExcepcional(e.target.value);
                                        if (errorMotivo) setErrorMotivo("");
                                    }}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-teal-600"
                                />
                                {errorMotivo && (
                                    <p className="text-[11px] font-semibold text-rose-700">{errorMotivo}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCitaAccesoExcepcional(null);
                                        setMotivoExcepcional("");
                                        setErrorMotivo("");
                                    }}
                                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmarAccesoExcepcional}
                                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                                >
                                    Registrar y Continuar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {modalAnularAbierto && citaParaAnular && (
                    <div className="fixed inset-0 bg-[#090d16]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[28px] shadow-2xl border border-rose-100 max-w-[440px] w-full p-8 sm:p-10 space-y-6 text-center relative z-10">
                            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm shrink-0 bg-rose-50 text-rose-600 border-rose-200">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-md font-bold">
                                    Acción Crítica · Registro Clínico
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight pt-1">
                                    ¿Desea anular esta consulta médica confirmada?
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed px-2">
                                    Está a punto de cancelar la cita del paciente{" "}
                                    <strong className="text-slate-800">{citaParaAnular.userEmail}</strong> (
                                    {citaParaAnular.especialidad}) programada para el{" "}
                                    <strong className="text-slate-800">{citaParaAnular.fecha}</strong> a las{" "}
                                    <strong className="text-slate-800">{citaParaAnular.hora}</strong>.
                                </p>
                                <p className="text-[11px] text-rose-600/90 font-medium pt-1">
                                    Esta acción quedará registrada en la auditoría y eliminará cualquier borrador pendiente.
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