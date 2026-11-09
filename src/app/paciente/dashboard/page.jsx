"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [warningMessage, setWarningMessage] = useState(null);
  const [citaACancelar, setCitaACancelar] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        
        const idTokenResult = await currentUser.getIdTokenResult(true);
        const adminStatus = idTokenResult.claims.role === "admin";
        setIsAdmin(adminStatus);
        
        const citasGuardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
        
        if (adminStatus) {
          setCitas(citasGuardadas);
        } else {
          const citasUsuario = citasGuardadas.filter(
            (cita) => cita.userId === currentUser.uid
          );
          setCitas(citasUsuario);
        }
        
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
    const citaAConfirmar = citasGlobales.find(c => c.id === id);

    const nuevasCitasGlobales = citasGlobales.map(cita => 
      cita.id === id ? { ...cita, estado: "Confirmada" } : cita
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
    setWarningMessage(null);
    setCitaACancelar(cita);
  };

  const handleConfirmarEliminacion = () => {
    if (!citaACancelar) return;

    const citasGlobales = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
    const nuevasCitasGlobales = citasGlobales.filter(cita => cita.id !== citaACancelar.id);
    localStorage.setItem("citas_educa360", JSON.stringify(nuevasCitasGlobales));

    if (isAdmin) {
      setCitas(nuevasCitasGlobales);
    } else {
      setCitas(nuevasCitasGlobales.filter(c => c.userId === user.uid));
    }

    const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
    const nuevoLog = {
      id: Date.now(),
      accion: isAdmin ? "ADMIN_CANCELAR_CITA" : "PACIENTE_ELIMINAR_CITA",
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-sm font-medium animate-pulse">Cargando panel...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-5xl mx-auto bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {isAdmin ? "Educa360 - Panel de Administración" : "Educa360 - Panel de Paciente"}
          </h1>
          <p className="text-xs text-gray-500">
            {isAdmin ? "Control centralizado y gestión de citas del sistema" : "Gestión y Seguimiento Académico y Personal"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs transition shadow-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto space-y-6">
        
        {isAdmin ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-purple-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Panel de Administración ⚙️</h2>
              <p className="text-gray-600 text-sm">Desde aquí puedes supervisar todas las citas solicitadas por los usuarios.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => router.push("/paciente/security-role")} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-purple-500 cursor-pointer transition">
                <h3 className="font-bold text-gray-900 text-base mb-1">🔒 Seguridad y Roles</h3>
                <p className="text-xs text-gray-500">Supervisa la validación de tokens.</p>
              </div>
              <div onClick={() => router.push("/paciente/auditoria")} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-500 cursor-pointer transition">
                <h3 className="font-bold text-gray-900 text-base mb-1">🛡️ Registro de Auditoría</h3>
                <p className="text-xs text-gray-500">Consulta el histórico de eventos.</p>
              </div>
            </div>

            {citaACancelar && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-sm text-red-800 font-medium">
                  ¿Estás seguro de cancelar la cita de <strong>{citaACancelar.especialidad}</strong> para el <strong>{citaACancelar.fecha}</strong> a las <strong>{citaACancelar.hora}</strong>?
                </p>
                <div className="flex space-x-2 shrink-0">
                  <button onClick={handleConfirmarEliminacion} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition">
                    Sí, cancelar cita
                  </button>
                  <button onClick={() => setCitaACancelar(null)} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-md transition">
                    Volver
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4">Gestión Global de Citas del Sistema</h3>
              {citas.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">
                  No hay citas registradas en el sistema.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                        <th className="py-3 px-4">Paciente (Email)</th>
                        <th className="py-3 px-4">Especialidad</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Hora</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm text-gray-800">
                      {citas.map((cita) => (
                        <tr key={cita.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-3 px-4 font-semibold text-gray-700">
                            {cita.userEmail || "Paciente sin correo (Antigua)"}
                          </td>
                          <td className="py-3 px-4 font-medium">{cita.especialidad}</td>
                          <td className="py-3 px-4">{cita.fecha}</td>
                          <td className="py-3 px-4">{cita.hora}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              cita.estado === "Confirmada" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                            }`}>
                              {cita.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center space-x-2">
                            {cita.estado !== "Confirmada" && (
                              <button onClick={() => handleAdminConfirmarCita(cita.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition">
                                Aceptar
                              </button>
                            )}
                            <button onClick={() => handleSolicitarCancelacion(cita)} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-md transition">
                              Cancelar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VISTA DE PACIENTE */
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-blue-600 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">¡Hola, {user?.displayName || "Paciente"}! 👋</h2>
                <p className="text-gray-600 text-sm">Gestiona tus citas personales en Educa360.</p>
              </div>
              <button onClick={() => router.push("/paciente/pedir-cita")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
                + Pedir Cita Nueva
              </button>
            </div>

            {warningMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex justify-between items-center">
                <span>{warningMessage}</span>
                <button onClick={() => setWarningMessage(null)} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-md transition shrink-0 ml-4">
                  Cerrar
                </button>
              </div>
            )}

            {citaACancelar && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ ¿Estás seguro de que deseas cancelar tu cita de <strong>{citaACancelar.especialidad}</strong> para el <strong>{citaACancelar.fecha}</strong> a las <strong>{citaACancelar.hora}</strong>?
                </p>
                <div className="flex space-x-2 shrink-0">
                  <button onClick={handleConfirmarEliminacion} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition">
                    Sí, cancelar cita
                  </button>
                  <button onClick={() => setCitaACancelar(null)} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-md transition">
                    Volver
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-gray-900">Mis Citas Solicitadas</h3>
                <span className="text-xs text-gray-500">{citas.length} cita(s) registrada(s)</span>
              </div>

              {citas.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">
                  No tienes ninguna cita programada todavía.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                        <th className="py-3 px-4">Especialidad</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Hora</th>
                        <th className="py-3 px-4">Observaciones</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm text-gray-800">
                      {citas.map((cita) => (
                        <tr key={cita.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-3 px-4 font-medium">{cita.especialidad}</td>
                          <td className="py-3 px-4">{cita.fecha}</td>
                          <td className="py-3 px-4">{cita.hora}</td>
                          <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate" title={cita.motivo}>
                            {cita.motivo || "Sin observaciones"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              cita.estado === "Confirmada" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                            }`}>
                              {cita.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => handleSolicitarCancelacion(cita)} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-md transition">
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
          </>
        )}
      </section>
    </main>
  );
}