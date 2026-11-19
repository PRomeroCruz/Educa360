"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { Tarjeta } from "@/components/ComponentesUI";
import { EstadoCargando } from "@/components/EstadosUI";

const CLAVE_FLAG_SEED_ACCESOS = "educa360_seed_accesos_excepcionales_v1";

function asegurarDatosInicialesAccesosExcepcionales() {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(CLAVE_FLAG_SEED_ACCESOS)) return;

    const ahora = new Date();
    const haceUnDia = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    const semillaPaciente = [
        {
        id: 1731930000001,
        tipo: "ACCESO_EXCEPCIONAL",
        excepcional: true,
        fechaHora: haceUnDia.toISOString(),
        fecha: haceUnDia.toISOString().split("T")[0],
        pacienteEmail: "paciente@educa360.test",
        medicoEmail: "medico@educa360.test",
        especialidad: "Medicina General",
        motivo: "Consulta urgente fuera de flujo por guardia clínica",
        origen: "SEED_LOCAL_STORAGE",
        },
    ];

    try {
        const clavePaciente = "accesos_excepcionales_paciente@educa360.test";
        const actualPaciente = JSON.parse(localStorage.getItem(clavePaciente) || "[]");
        if (actualPaciente.length === 0) {
        localStorage.setItem(clavePaciente, JSON.stringify(semillaPaciente));
        }

        const actualGlobal = JSON.parse(localStorage.getItem("accesos_excepcionales_educa360") || "[]");
        if (actualGlobal.length === 0) {
        localStorage.setItem("accesos_excepcionales_educa360", JSON.stringify(semillaPaciente));
        }

        localStorage.setItem(CLAVE_FLAG_SEED_ACCESOS, "true");
    } catch (err) {
        console.error("Error inicializando semilla de accesos excepcionales:", err);
    }
    }

    export default function PacienteAccesosExcepcionalesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthGuard("paciente");

    const [accesosExcepcionales, setAccesosExcepcionales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);

        try {
        asegurarDatosInicialesAccesosExcepcionales();

        if (user?.email) {
            const accesosGuardados = JSON.parse(
            localStorage.getItem(`accesos_excepcionales_${user.email}`) || "[]"
            );
            setAccesosExcepcionales(accesosGuardados);
        }
        } catch {
        setAccesosExcepcionales([]);
        }

        if (!authLoading) {
        setLoading(false);
        clearTimeout(timer);
        }

        return () => clearTimeout(timer);
    }, [user, authLoading]);

    const handleCerrarSesion = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (loading || authLoading) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <EstadoCargando mensaje="Cargando registro de accesos excepcionales..." />
        </div>
        );
    }

    return (
        <PortalShell
        rolLabel="Portal Paciente"
        rolTipo="paciente"
        usuarioNombre="Paciente Registrado"
        usuarioEmail={user?.email || "paciente@educa360.test"}
        onLogout={handleCerrarSesion}
        >
        <div className="space-y-6">
            <div className="border-b border-slate-200/80 pb-5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                Transparencia y Privacidad
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                Accesos Excepcionales a su Expediente
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
                Consultas realizadas por profesionales sin relación asistencial previa asignada, con su motivo registrado.
            </p>
            </div>

            <Tarjeta
            titulo="Historial de Accesos Excepcionales"
            subtitulo="Registro detallado de quién accedió, cuándo y por qué motivo."
            >
            {accesosExcepcionales.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                No se han registrado accesos excepcionales a su expediente.
                </p>
            ) : (
                <div className="space-y-3 pt-2">
                {accesosExcepcionales.map((acceso) => (
                    <div
                    key={acceso.id}
                    className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/40 space-y-2"
                    >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                        Profesional: {acceso.medicoEmail} · {acceso.especialidad}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ACCESO EXCEPCIONAL
                        </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500">
                        Fecha y hora: {acceso.fecha} ({acceso.fechaHora})
                    </p>
                    <p className="text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-amber-200/70">
                        <strong className="font-semibold text-slate-900">Motivo registrado:</strong> {acceso.motivo}
                    </p>
                    </div>
                ))}
                </div>
            )}
            </Tarjeta>
        </div>
        </PortalShell>
    );
}