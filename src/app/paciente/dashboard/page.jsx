"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { Tarjeta } from "@/components/ComponentesUI";
import { EstadoCargando, EstadoVacio } from "@/components/EstadosUI";

export default function PacienteDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard("paciente");
  
  const [citas, setCitas] = useState([]);
  const [leidos, setLeidos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);

    try {
      const citasGuardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
      setCitas(citasGuardadas);
      
      if (user) {
        const leidosGuardados = JSON.parse(localStorage.getItem(`leidos_${user.uid}`) || "{}");
        setLeidos(leidosGuardados);
      }
    } catch {
      setCitas([]);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <EstadoCargando mensaje="Cargando portal clínico del paciente..." />
      </div>
    );
  }

  const misCitas = citas.filter((c) => c.userEmail === user?.email);

  const citasOrdenadas = [...misCitas].sort((a, b) => {
    const fechaA = new Date(`${a.fecha}T${(a.hora || "09:00").replace(" h", "")}`);
    const fechaB = new Date(`${b.fecha}T${(b.hora || "09:00").replace(" h", "")}`);
    return fechaA - fechaB;
  });

  const confirmadas = citasOrdenadas.filter((c) => (c.estado || "").toLowerCase().includes("confirmada"));
  const pendientes = citasOrdenadas.filter((c) => (c.estado || "").toLowerCase().includes("pendiente"));
  const canceladas = citasOrdenadas.filter((c) => (c.estado || "").toLowerCase().includes("cancelada"));

  const totalPendientesLectura = misCitas.filter(
    (c) => (c.estado || "").toLowerCase().includes("completada") && c.diagnostico && !leidos[c.id]
  ).length;

  const renderizarTarjetaCita = (c) => {
    const estadoLower = (c.estado || "pendiente").toLowerCase();

    return (
      <div key={c.id} className="p-4 rounded-2xl border transition bg-white space-y-3 border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900">{c.especialidad}</span>
            <p className="text-[11px] font-mono text-slate-500">
              Fecha: {c.fecha} a las {c.hora}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            estadoLower.includes("confirmada") ? "bg-teal-50 text-teal-700 border-teal-200" :
            estadoLower.includes("cancelada") ? "bg-rose-50 text-rose-700 border-rose-200" :
            "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {c.estado || "Pendiente"}
          </span>
        </div>
        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="font-semibold text-slate-700">Motivo:</span> {c.motivo}
        </p>
      </div>
    );
  };

  return (
    <PortalShell
      rolLabel="Portal Paciente"
      rolTipo="paciente"
      usuarioNombre="Paciente Registrado"
      usuarioEmail={user?.email || "paciente@educa360.test"}
      onLogout={handleCerrarSesion}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
              Área de Salud y Expedientes
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Historial Clínico de Consultas</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervise el estado de sus citas activas y pendientes de validación institucional.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/paciente/diagnosticos")}
              className="relative px-4 py-2.5 bg-[#090d16] hover:bg-slate-900 text-white rounded-xl transition border border-slate-800 shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-xs font-semibold">Notificaciones</span>
              {totalPendientesLectura > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#090d16] shadow-md">
                  {totalPendientesLectura}
                </span>
              )}
            </button>

            <a
              href="/paciente/pedir-cita"
              className="py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-900/20 transition cursor-pointer"
            >
              + Pedir Nueva Cita
            </a>
          </div>
        </div>

        <Tarjeta titulo="Historial y Estado de Citas Activas" subtitulo="Consultas ordenadas cronológicamente.">
          {confirmadas.length === 0 && pendientes.length === 0 && canceladas.length === 0 ? (
            <EstadoVacio titulo="No hay citas activas" descripcion="Utilice el botón superior para solicitar su primera cita médica." />
          ) : (
            <div className="space-y-6 pt-2">
              {confirmadas.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Citas Confirmadas ({confirmadas.length})</span>
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  </div>
                  <div className="space-y-3">{confirmadas.map(renderizarTarjetaCita)}</div>
                </div>
              )}
              {pendientes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pendientes de Validación ({pendientes.length})</span>
                  </div>
                  <div className="space-y-3">{pendientes.map(renderizarTarjetaCita)}</div>
                </div>
              )}
              {canceladas.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Citas Canceladas ({canceladas.length})</span>
                  </div>
                  <div className="space-y-3">{canceladas.map(renderizarTarjetaCita)}</div>
                </div>
              )}
            </div>
          )}
        </Tarjeta>
      </div>
    </PortalShell>
  );
}