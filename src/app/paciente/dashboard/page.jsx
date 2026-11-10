"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function DashboardPacientePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState([]);
  
  const [warningMessage, setWarningMessage] = useState(null);
  const [citaACancelar, setCitaACancelar] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        
        // Carga de citas filtradas únicamente para el paciente en sesión
        const citasGuardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
        const citasUsuario = citasGuardadas.filter(
          (cita) => cita.userId === currentUser.uid
        );
        setCitas(citasUsuario);
        
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

  const handleSolicitarCancelacion = (cita) => {
    setWarningMessage(null);
    setCitaACancelar(cita);
  };

  const handleConfirmarEliminacion = () => {
    if (!citaACancelar) return;

    const citasGlobales = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
    const nuevasCitasGlobales = citasGlobales.filter(cita => cita.id !== citaACancelar.id);
    localStorage.setItem("citas_educa360", JSON.stringify(nuevasCitasGlobales));

    setCitas(nuevasCitasGlobales.filter(c => c.userId === user.uid));

    const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
    const nuevoLog = {
      id: Date.now(),
      accion: "PACIENTE_ELIMINAR_CITA",
      userEmail: user?.email || "Usuario",
      descripcion: `Se canceló la cita de ${citaACancelar?.especialidad || "Desconocida"}`,
      fecha: new Date().toLocaleString(),
      tipo: "warning"
    };
    localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));

    setCitaACancelar(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500 text-sm font-medium tracking-wide animate-pulse">Cargando sistema...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              E
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-wide">
                Educa360
              </h1>
              <p className="text-[11px] text-slate-400">
                Gestión de servicios médicos y académicos
              </p>
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

      <section className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md shadow-sm">
              Rol: Paciente
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">Bienvenido, {user?.displayName || "Usuario"}</h2>
            <p className="text-slate-500 text-xs mt-0.5">Gestione sus citas médicas y de atención especializada.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
              {user?.email}
            </span>
            <button onClick={() => router.push("/paciente/pedir-cita")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
              + Solicitar Nueva Cita
            </button>
          </div>
        </div>

        {warningMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex justify-between items-center">
            <span>{warningMessage}</span>
            <button onClick={() => setWarningMessage(null)} className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded transition">
              Cerrar
            </button>
          </div>
        )}

        {citaACancelar && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-red-900 font-medium">
              ¿Estás seguro de que deseas cancelar tu cita de <strong>{citaACancelar.especialidad}</strong> para el <strong>{citaACancelar.fecha}</strong> a las <strong>{citaACancelar.hora}</strong>?
            </p>
            <div className="flex space-x-2 shrink-0">
              <button onClick={handleConfirmarEliminacion} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition shadow-sm">
                Sí, cancelar
              </button>
              <button onClick={() => setCitaACancelar(null)} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition">
                Volver
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Mis Citas Solicitadas</h3>
            <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md">
              {citas.length === 1 ? "1 cita registrada" : `${citas.length} citas registradas`}
            </span>
          </div>

          {citas.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No tienes ninguna cita registrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Especialidad</th>
                    <th className="py-3 px-5">Fecha</th>
                    <th className="py-3 px-5">Hora</th>
                    <th className="py-3 px-5">Observaciones</th>
                    <th className="py-3 px-5">Estado</th>
                    <th className="py-3 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {citas.map((cita) => (
                    <tr key={cita.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5 text-slate-900 font-medium">{cita.especialidad}</td>
                      <td className="py-3.5 px-5 text-slate-600">{cita.fecha}</td>
                      <td className="py-3.5 px-5 text-slate-600">{cita.hora}</td>
                      <td className="py-3.5 px-5 text-slate-500 max-w-[200px] truncate" title={cita.motivo}>
                        {cita.motivo || "Sin observaciones"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                          cita.estado === "Confirmada" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {cita.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button onClick={() => handleSolicitarCancelacion(cita)} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-semibold rounded transition">
                          Anular
                        </button>
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