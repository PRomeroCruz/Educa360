"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function AdminGeneralDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [citasGlobales, setCitasGlobales] = useState([]);
    
    const [alerta, setAlerta] = useState({ texto: "", tipo: "success" });
    
    const [citaAEliminar, setCitaAEliminar] = useState(null);
    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (!currentUser) {
            router.push("/login");
        } else {
            setUser(currentUser);
            cargarCitas();
            setLoading(false);
        }
        });
        return () => unsubscribe();
    }, [router]);

    const cargarCitas = () => {
        const guardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
        setCitasGlobales(guardadas);
    };

    const handleCambiarEstado = (idCita, nuevoEstado) => {
        const citaAfectada = citasGlobales.find(c => c.id === idCita);

        const citasActualizadas = citasGlobales.map((c) => {
        if (c.id === idCita) {
            return { ...c, estado: nuevoEstado };
        }
        return c;
        });

        setCitasGlobales(citasActualizadas);
        localStorage.setItem("citas_educa360", JSON.stringify(citasActualizadas));

        const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
        const nuevoLog = {
        id: Date.now(),
        accion: "MODIFICAR_CITA_ADMIN",
        userEmail: user.email,
        descripcion: `El administrador general cambió el estado de la cita de ${citaAfectada?.userEmail || "paciente"} (${citaAfectada?.especialidad || "General"}) a: ${nuevoEstado}`,
        fecha: new Date().toLocaleString(),
        tipo: nuevoEstado === "Cancelada" ? "danger" : "success"
        };
        localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));

        setAlerta({
        texto: `Cita actualizada a estado: ${nuevoEstado}`,
        tipo: nuevoEstado === "Cancelada" ? "danger" : "success"
        });
        setTimeout(() => setAlerta({ texto: "", tipo: "success" }), 3000);
    };

    const abrirModalEliminar = (cita) => {
        setCitaAEliminar(cita);
        setMostrarModalEliminar(true);
    };

    const confirmarEliminarCita = () => {
        if (!citaAEliminar) return;

        const citasActualizadas = citasGlobales.filter((c) => c.id !== citaAEliminar.id);
        setCitasGlobales(citasActualizadas);
        localStorage.setItem("citas_educa360", JSON.stringify(citasActualizadas));

        const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
        const nuevoLog = {
        id: Date.now(),
        accion: "ELIMINAR_CITA_ADMIN",
        userEmail: user.email,
        descripcion: `El administrador general eliminó la cita de ${citaAEliminar?.userEmail || "paciente"} (${citaAEliminar?.especialidad || "General"})`,
        fecha: new Date().toLocaleString(),
        tipo: "danger"
        };
        localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));

        setMostrarModalEliminar(false);
        setCitaAEliminar(null);
        setAlerta({ texto: "Cita eliminada correctamente del sistema.", tipo: "danger" });
        setTimeout(() => setAlerta({ texto: "", tipo: "success" }), 3000);
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (loading) {
        return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <p className="text-slate-500 text-sm font-medium tracking-wide animate-pulse">Cargando panel de administración...</p>
        </div>
        );
    }

    const citasCanceladasCount = citasGlobales.filter(c => c.estado === "Cancelada").length;

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
                <p className="text-[11px] text-slate-400">Gestión Global Institucional</p>
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

        {mostrarModalEliminar && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 border border-red-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900">¿Eliminar cita permanentemente?</h3>
                    <p className="text-xs text-slate-500">Esta acción borrará la reserva del paciente de forma definitiva.</p>
                </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                <button
                    onClick={() => setMostrarModalEliminar(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                    Cancelar
                </button>
                <button
                    onClick={confirmarEliminarCita}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                    Aceptar
                </button>
                </div>
            </div>
            </div>
        )}

        <section className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2 flex justify-between items-center">
                <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    Rol: Administración (General)
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">Panel de Moderación y Citas Globales</h2>
                <p className="text-slate-500 text-xs mt-0.5">Control global de reservas, moderación de citas y atención institucional.</p>
                </div>
                <div className="text-right">
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    {user?.email}
                </span>
                </div>
            </div>

            <div className={`p-6 rounded-xl shadow-sm border transition ${
                citasCanceladasCount > 0 
                ? "bg-red-50 border-red-200 text-red-900" 
                : "bg-white border-slate-200 text-slate-900"
            }`}>
                <div className="flex justify-between items-center">
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${citasCanceladasCount > 0 ? "text-red-700" : "text-slate-500"}`}>
                    Citas Canceladas
                    </p>
                    <h3 className="text-2xl font-extrabold mt-1">{citasCanceladasCount}</h3>
                </div>
                </div>
                <p className={`text-[11px] mt-2 ${citasCanceladasCount > 0 ? "text-red-600" : "text-slate-400"}`}>
                {citasCanceladasCount > 0 ? "Requieren atención o revisión" : "Sin cancelaciones registradas"}
                </p>
            </div>
            </div>

            {alerta.texto && (
            <div className={`p-4 rounded-xl border text-xs font-semibold ${
                alerta.tipo === "danger"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
                {alerta.texto}
            </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Listado General de Citas del Sistema</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Paciente (Correo)</th>
                    <th className="py-3 px-4">Especialidad</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones de Moderación</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                    {citasGlobales.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-400">
                        No hay citas registradas en el sistema.
                        </td>
                    </tr>
                    ) : (
                    citasGlobales.map((cita) => (
                        <tr key={cita.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-medium text-slate-800">{cita.userEmail}</td>
                        <td className="py-3 px-4 text-slate-600">{cita.especialidad}</td>
                        <td className="py-3 px-4 text-slate-600">{cita.fecha} - {cita.hora}</td>
                        <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                            cita.estado === "Cancelada"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : cita.estado === "Completada" || cita.estado === "Confirmada"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                            {cita.estado || "Pendiente"}
                            </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                            <button
                                onClick={() => handleCambiarEstado(cita.id, "Confirmada")}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition text-[11px]"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Confirmar
                            </button>
                            <button
                                onClick={() => handleCambiarEstado(cita.id, "Cancelada")}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition text-[11px]"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancelar
                            </button>
                            <button
                                onClick={() => abrirModalEliminar(cita)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition text-[11px]"
                                title="Eliminar cita"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
            </div>
        </section>
        </main>
    );
}