"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function AdminGeneralDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [citas, setCitas] = useState([]);
    const [citaACancelar, setCitaACancelar] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
            router.push("/login");
        } else {
            setUser(currentUser);
            
            const citasGuardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
            setCitas(citasGuardadas);
            setLoading(false);
        }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        try {
        await signOut(auth);
        router.push("/login");
        } catch (error) {
        console.error("Error al cerrar sesión:", error);
        }
    };

    const handleAdminConfirmarCita = (id) => {
        const citasGlobales = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
        const citaAConfirmar = citasGlobales.find(c => String(c.id) === String(id));

        const nuevasCitasGlobales = citasGlobales.map(cita => 
        String(cita.id) === String(id) ? { ...cita, estado: "Confirmada" } : cita
        );
        
        localStorage.setItem("citas_educa360", JSON.stringify(nuevasCitasGlobales));
        setCitas(nuevasCitasGlobales);

        const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
        const nuevoLog = {
        id: Date.now(),
        accion: "ADMIN_CONFIRMAR_CITA",
        userEmail: citaAConfirmar?.userEmail || "Administrador",
        descripcion: `Se confirmó la cita de ${citaAConfirmar?.especialidad || "Desconocida"}`,
        fecha: new Date().toLocaleString(),
        tipo: "success"
        };
        localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));
    };

    const handleSolicitarCancelacion = (cita) => {
        setCitaACancelar(cita);
    };

    const handleConfirmarEliminacion = () => {
        if (!citaACancelar) return;

        const citasGlobales = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
        const nuevasCitasGlobales = citasGlobales.map(cita => 
        String(cita.id) === String(citaACancelar.id) ? { ...cita, estado: "Cancelada" } : cita
        );
        localStorage.setItem("citas_educa360", JSON.stringify(nuevasCitasGlobales));

        setCitas(nuevasCitasGlobales);

        const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
        const nuevoLog = {
        id: Date.now(),
        accion: "ADMIN_CANCELAR_CITA",
        userEmail: user?.email || "Administrador",
        descripcion: `Se canceló la cita de ${citaACancelar?.especialidad || "Desconocida"}`,
        fecha: new Date().toLocaleString(),
        tipo: "warning"
        };
        localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));

        setCitaACancelar(null);
    };

    const formatEstado = (estado) => {
        if (!estado) return "Pendiente";
        const est = estado.toLowerCase();
        if (est === "completada" || est === "atendida") return "Completada";
        if (est === "confirmada") return "Confirmada";
        if (est === "cancelada" || est === "anulada") return "Cancelada";
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    };

    const getBadgeStyle = (estado) => {
        const est = (estado || "").toLowerCase();
        if (est === "confirmada") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        if (est === "completada" || est === "atendida") return "bg-blue-50 text-blue-700 border border-blue-200";
        if (est === "cancelada" || est === "anulada") return "bg-red-50 text-red-700 border border-red-200";
        return "bg-amber-50 text-amber-700 border border-amber-200";
    };

    if (loading) {
        return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <p className="text-slate-500 text-sm font-medium tracking-wide animate-pulse">Cargando sistema...</p>
        </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 pb-12 relative">
        <header className="bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                E
                </div>
                <div>
                <h1 className="text-sm font-semibold text-white tracking-wide">Educa360</h1>
                <p className="text-[11px] text-slate-400">Entorno seguro de supervisión institucional</p>
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700 shadow-sm"
            >
                Cerrar Sesión
            </button>
            </div>
        </header>

        {citaACancelar && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl border border-red-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 border border-red-200 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">¿Confirmar cancelación de cita?</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                ¿Desea cancelar la cita de <strong>{citaACancelar.especialidad}</strong> programada para el <strong>{citaACancelar.fecha}</strong> a las <strong>{citaACancelar.hora}</strong>?
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button
                            onClick={() => setCitaACancelar(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                        >
                            Volver
                        </button>
                        <button
                            onClick={handleConfirmarEliminacion}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                        >
                            Sí, cancelar
                        </button>
                    </div>
                </div>
            </div>
        )}

        <section className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md shadow-sm">
                Rol: Administrador del Sistema
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">Panel Central de Operaciones</h2>
                <p className="text-slate-500 text-xs mt-0.5">Supervisión en tiempo real de citas y reservas institucionales.</p>
            </div>
            <div className="text-right">
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
                {user?.email}
                </span>
            </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                <h3 className="text-sm font-bold text-slate-900">Gestión Global de Citas del Sistema</h3>
                <p className="text-xs text-slate-500">Listado general de todas las reservas en la plataforma.</p>
                </div>
                <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md">
                {citas.length === 1 ? "1 cita registrada" : `${citas.length} citas registradas`}
                </span>
            </div>

            {citas.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                No hay citas registradas en el sistema.
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-5">Paciente (Email)</th>
                        <th className="py-3 px-5">Especialidad</th>
                        <th className="py-3 px-5">Fecha</th>
                        <th className="py-3 px-5">Hora</th>
                        <th className="py-3 px-5">Estado</th>
                        <th className="py-3 px-5 text-right">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {citas.map((cita) => (
                        <tr key={cita.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-5 font-mono text-slate-900">
                            {cita.userEmail || "Paciente sin correo"}
                        </td>
                        <td className="py-3.5 px-5 text-slate-900">{cita.especialidad}</td>
                        <td className="py-3.5 px-5 text-slate-600">{cita.fecha}</td>
                        <td className="py-3.5 px-5 text-slate-600">{cita.hora}</td>
                        <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${getBadgeStyle(cita.estado)}`}>
                            {formatEstado(cita.estado)}
                            </span>
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-2">
                            {cita.estado !== "Confirmada" && cita.estado?.toLowerCase() !== "completada" && cita.estado?.toLowerCase() !== "cancelada" && (
                            <button onClick={() => handleAdminConfirmarCita(cita.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded shadow-sm transition">
                                Aceptar
                            </button>
                            )}
                            {cita.estado?.toLowerCase() !== "cancelada" && (
                            <button onClick={() => handleSolicitarCancelacion(cita)} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-semibold rounded transition">
                                Cancelar
                            </button>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </div>
        </section>
        </main>
    );
}