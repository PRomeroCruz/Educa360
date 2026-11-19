"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { EstadoCargando } from "@/components/EstadosUI";
import { registrarLogSistema } from "@/app/admin/dashboard/page";

const ESTADOS_PRUEBA = ["Solicitada", "En curso", "Con resultado", "Informada"];

const TRANSICIONES_VALIDAS = {
    "Solicitada": ["En curso"],
    "En curso": ["Con resultado"],
    "Con resultado": ["Informada"],
    "Informada": [],
};

export function esTransicionPruebaValida(estadoActual, siguienteEstado) {
    const permitidos = TRANSICIONES_VALIDAS[estadoActual] || [];
    return permitidos.includes(siguienteEstado);
}

export default function MedicoSolicitudesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthGuard("profesional_sanitario, medico");

    const [solicitudesPruebas, setSolicitudesPruebas] = useState([]);
    const [resultadosInput, setResultadosInput] = useState({});
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "success" });

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);

        try {
            const pruebasGuardadas = JSON.parse(localStorage.getItem("solicitudes_pruebas_educa360") || "[]");
            setSolicitudesPruebas(pruebasGuardadas);
        } catch {
            setSolicitudesPruebas([]);
        }

        if (!authLoading) {
            setLoading(false);
            clearTimeout(timer);
        }

        return () => clearTimeout(timer);
    }, [authLoading]);

    const avanzarEstadoPrueba = (pruebaId, siguienteEstado) => {
        const pruebaActual = solicitudesPruebas.find((p) => p.id === pruebaId);
        if (!pruebaActual) return;

        if (!esTransicionPruebaValida(pruebaActual.estado, siguienteEstado)) {
            setMensaje({
                texto: `Transición no permitida de "${pruebaActual.estado}" a "${siguienteEstado}".`,
                tipo: "error",
            });
            setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
            return;
        }

        let textoResultado = pruebaActual.resultado || "";
        if (siguienteEstado === "Con resultado") {
            const ingresado = (resultadosInput[pruebaId] || "").trim();
            if (!ingresado) {
                setMensaje({
                    texto: "Introduzca el resultado de la prueba antes de pasarla a Con resultado.",
                    tipo: "error",
                });
                setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
                return;
            }
            textoResultado = ingresado;
        }

        const actualizadas = solicitudesPruebas.map((p) => {
            if (p.id === pruebaId) {
                return {
                    ...p,
                    estado: siguienteEstado,
                    resultado: textoResultado,
                };
            }
            return p;
        });

        setSolicitudesPruebas(actualizadas);
        localStorage.setItem("solicitudes_pruebas_educa360", JSON.stringify(actualizadas));

        registrarLogSistema(
            "PRUEBA_ESTADO",
            user?.email || "medico@educa360.test",
            `Prueba "${pruebaActual.tipoPrueba}" (${pruebaActual.pacienteEmail}) avanzó de "${pruebaActual.estado}" a "${siguienteEstado}".`
        );

        setMensaje({
            texto: `La prueba "${pruebaActual.tipoPrueba}" ha pasado a estado: ${siguienteEstado}.`,
            tipo: "success",
        });
        setTimeout(() => setMensaje({ texto: "", tipo: "success" }), 4000);
    };

    const handleCerrarSesion = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <EstadoCargando mensaje="Cargando solicitudes de pruebas..." />
            </div>
        );
    }

    const badgeEstadoPrueba = (estado) => {
        switch (estado) {
            case "Solicitada":
                return "bg-amber-50 text-amber-800 border-amber-200";
            case "En curso":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "Con resultado":
                return "bg-purple-50 text-purple-700 border-purple-200";
            case "Informada":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            default:
                return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

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
                            Solicitudes de Pruebas Clínicas y Estados
                        </h1>
                        <p className="text-xs text-slate-500">
                            Flujo de estados validado: {ESTADOS_PRUEBA.join(" → ")}.
                        </p>
                    </div>
                    <Link
                        href="/medico/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition border border-slate-200 cursor-pointer"
                    >
                        Volver a Agenda
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
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-2">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                            Listado de Solicitudes de Pruebas
                        </h2>
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {solicitudesPruebas.length} {solicitudesPruebas.length === 1 ? "solicitud" : "solicitudes"}
                        </span>
                    </div>

                    <div className="p-6">
                        {solicitudesPruebas.length === 0 ? (
                            <div className="py-12 text-center space-y-1 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-xs font-bold text-slate-700">
                                    No hay solicitudes de pruebas registradas
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Abre &ldquo;Atender&rdquo; en una consulta confirmada desde la agenda para solicitar una prueba.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {solicitudesPruebas.map((prueba) => {
                                    const siguientesEstados = TRANSICIONES_VALIDAS[prueba.estado] || [];
                                    const requiereResultado = siguientesEstados.includes("Con resultado");

                                    return (
                                        <div
                                            key={prueba.id}
                                            className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 flex flex-col justify-between gap-3"
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900">
                                                        {prueba.tipoPrueba}
                                                    </span>
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeEstadoPrueba(
                                                            prueba.estado
                                                        )}`}
                                                    >
                                                        {prueba.estado}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-slate-500 font-mono">
                                                    Paciente: {prueba.pacienteEmail} · {prueba.fechaSolicitud}
                                                </p>

                                                <p className="text-xs text-slate-700">
                                                    <strong className="font-semibold text-slate-900">Indicaciones:</strong>{" "}
                                                    {prueba.indicaciones}
                                                </p>

                                                {prueba.resultado && (
                                                    <p className="text-xs text-emerald-900 bg-emerald-50/80 border border-emerald-200/80 px-3 py-2 rounded-xl">
                                                        <strong className="font-bold">Resultado registrado:</strong>{" "}
                                                        {prueba.resultado}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                                {requiereResultado && (
                                                    <input
                                                        type="text"
                                                        placeholder="Escribir resultado..."
                                                        value={resultadosInput[prueba.id] || ""}
                                                        onChange={(e) =>
                                                            setResultadosInput((prev) => ({
                                                                ...prev,
                                                                [prueba.id]: e.target.value,
                                                            }))
                                                        }
                                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-teal-600"
                                                    />
                                                )}

                                                {siguientesEstados.length === 0 ? (
                                                    <span className="text-[11px] font-mono text-slate-400">
                                                        Flujo finalizado
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {siguientesEstados.map((sigEstado) => (
                                                            <button
                                                                key={sigEstado}
                                                                type="button"
                                                                onClick={() => avanzarEstadoPrueba(prueba.id, sigEstado)}
                                                                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                                                            >
                                                                Marcar: {sigEstado}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PortalShell>
    );
}