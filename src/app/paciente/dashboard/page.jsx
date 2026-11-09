"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function PacienteDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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

  const handlePedirCita = () => {
    router.push("/paciente/pedir-cita");
  };

  const handleVerAuditoria = () => {
    router.push("/paciente/auditoria");
  };

  const handleConfirmarCita = (id) => {
    const citaAConfirmar = citas.find(c => c.id === id);

    const nuevasCitas = citas.map(cita => 
      cita.id === id ? { ...cita, estado: "Confirmada" } : cita
    );
    setCitas(nuevasCitas);
    localStorage.setItem("citas_educa360", JSON.stringify(nuevasCitas));

    const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
    const nuevoLog = {
      id: Date.now(),
      accion: "CONFIRMAR_CITA",
      descripcion: `Se confirmó la cita de ${citaAConfirmar?.especialidad || "Desconocida"}`,
      fecha: new Date().toLocaleString(),
      tipo: "success"
    };
    localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));
  };

  const handleEliminarCita = (id) => {
    const citaAEliminar = citas.find(c => c.id === id);

    const nuevasCitas = citas.filter(cita => cita.id !== id);
    setCitas(nuevasCitas);
    localStorage.setItem("citas_educa360", JSON.stringify(nuevasCitas));

    const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
    const nuevoLog = {
      id: Date.now(),
      accion: "ELIMINAR_CITA",
      descripcion: `Se eliminó / canceló la cita de ${citaAEliminar?.especialidad || "Desconocida"}`,
      fecha: new Date().toLocaleString(),
      tipo: "warning"
    };
    
    const logsActualizados = [nuevoLog, ...logsActuales];
    localStorage.setItem("logs_educa360", JSON.stringify(logsActualizados));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-black text-lg font-medium">Cargando panel del paciente...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Barra superior */}
      <header className="max-w-5xl mx-auto bg-white p-4 rounded-xl shadow-md flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Educa360 - Panel de Paciente</h1>
          <p className="text-xs text-gray-500">Gestión y Seguimiento Académico y Personal</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleVerAuditoria}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition duration-200 text-sm focus:outline-none"
          >
            🛡️ Ver Auditoría
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition duration-200 text-sm focus:outline-none"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <section className="max-w-5xl mx-auto space-y-6">
        
        {/* Saludo */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-600 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              ¡Hola, {user?.displayName || "Paciente"}! 👋
            </h2>
            <p className="text-gray-700 text-sm">
              Bienvenido a tu espacio personal en **Educa360**. Aquí puedes gestionar tus citas reales.
            </p>
          </div>
          <button
            onClick={handlePedirCita}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow transition"
          >
            + Pedir Cita Nueva
          </button>
        </div>

        {/* Tarjetas de Información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Datos Personales
            </h3>
            <div className="space-y-2 text-sm text-black">
              <p><strong>Nombre:</strong> {user?.displayName || "No especificado"}</p>
              <p><strong>Correo electrónico:</strong> {user?.email}</p>
              <p><strong>Identificador (UID):</strong> <span className="font-mono text-xs">{user?.uid}</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Estado de Verificación
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`h-3 w-3 rounded-full ${user?.emailVerified ? "bg-green-500" : "bg-yellow-500"}`}></span>
              <span className="text-black font-medium">
                {user?.emailVerified ? "Cuenta Verificada" : "Verificación Pendiente"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {user?.emailVerified 
                ? "Tu cuenta está activa y validada correctamente." 
                : "Por favor, revisa tu bandeja de entrada para activar por completo tu cuenta."}
            </p>
          </div>
        </div>

        {/* Tabla Dinámica de Citas */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Mis Citas Solicitadas</h3>
            <span className="text-xs text-gray-500">{citas.length} cita(s) registrada(s)</span>
          </div>

          {citas.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">
              No tienes ninguna cita programada todavía. Pulsa en <strong>"+ Pedir Cita Nueva"</strong> para añadir una.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="py-3 px-4">Especialidad</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Hora</th>
                    <th className="py-3 px-4">Motivo</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-black">
                  {citas.map((cita) => (
                    <tr key={cita.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-medium">{cita.especialidad}</td>
                      <td className="py-3 px-4">{cita.fecha}</td>
                      <td className="py-3 px-4">{cita.hora}</td>
                      <td className="py-3 px-4 text-gray-600">{cita.motivo || "Sin observaciones"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          cita.estado === "Confirmada" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {cita.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center space-x-2">
                        {cita.estado !== "Confirmada" && (
                          <button 
                            onClick={() => handleConfirmarCita(cita.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition"
                          >
                            Confirmar
                          </button>
                        )}
                        <button 
                          onClick={() => handleEliminarCita(cita.id)}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition"
                        >
                          Eliminar
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