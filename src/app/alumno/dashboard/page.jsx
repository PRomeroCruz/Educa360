"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { Tarjeta } from "@/components/ComponentesUI";
import { EstadoCargando, EstadoVacio } from "@/components/EstadosUI";

export default function AlumnoDashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthGuard("alumno");
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleCerrarSesion = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <EstadoCargando mensaje="Cargando entorno formativo clínico..." />
        </div>
        );
    }

    return (
        <PortalShell
        rolLabel="Alumno en Prácticas"
        rolTipo="alumno"
        usuarioNombre="Alejandro Alumno"
        usuarioEmail={user?.email || "alumno@educa360.test"}
        onLogout={handleCerrarSesion}
        >
        <div className="space-y-6">
            <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                Formación Clínica Tutelada
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Casos Clínicos de Estudio</h1>
            <p className="text-xs text-slate-500 mt-0.5">
                Acceso en modo visualización y aprendizaje a las consultas y expedientes del centro.
            </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-amber-200">
                i
            </div>
            <div className="space-y-1">
                <h2 className="text-xs font-bold text-amber-900 tracking-tight">Control de Supervisión Docente y Privilegios de Lectura</h2>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Este perfil se encuentra bajo tutoría clínica activa. Las operaciones de modificación, creación o cancelación de expedientes se encuentran restringidas; el usuario cuenta exclusivamente con privilegios de consulta y auditoría formativa.
                </p>
            </div>
            </div>

            <Tarjeta titulo="Historial de Casos y Consultas del Sistema" subtitulo="Registro general disponible para consulta formativa.">
            {citas.length === 0 ? (
                <EstadoVacio titulo="No hay casos registrados" descripcion="Los expedientes del sistema aparecerán aquí conforme se vayan generando." />
            ) : (
                <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                    <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                        <th className="pb-3 font-bold">Paciente</th>
                        <th className="pb-3 font-bold">Especialidad</th>
                        <th className="pb-3 font-bold">Fecha / Hora</th>
                        <th className="pb-3 font-bold">Estado</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {citas.map((c) => {
                        const estadoLower = (c.estado || "pendiente").toLowerCase();
                        return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 font-medium text-slate-900">{c.userEmail || c.nombrePaciente || "Paciente Clínico"}</td>
                            <td className="py-3 text-slate-600">{c.especialidad}</td>
                            <td className="py-3 font-mono text-slate-500">{c.fecha} ({c.hora})</td>
                            <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-block ${
                                estadoLower.includes("confirmada") ? "bg-teal-50 text-teal-700 border-teal-200" :
                                estadoLower.includes("completada") ? "bg-slate-100 text-slate-700 border-slate-200" :
                                estadoLower.includes("cancelada") ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                                {c.estado || "Pendiente"}
                            </span>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
            )}
            </Tarjeta>
        </div>
        </PortalShell>
    );
}