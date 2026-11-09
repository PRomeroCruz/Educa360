"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function AuditoriaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        
        const logsGuardados = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
        
        if (logsGuardados.length === 0) {
          const logsIniciales = [
            { id: 1, accion: "INICIO_SESION", descripcion: "Acceso exitoso al sistema", fecha: new Date().toLocaleString(), tipo: "success" },
            { id: 2, accion: "REGISTRO_USUARIO", descripcion: "Creación de cuenta en Educa360", fecha: new Date(Date.now() - 3600000).toLocaleString(), tipo: "info" }
          ];
          localStorage.setItem("logs_educa360", JSON.stringify(logsIniciales));
          setLogs(logsIniciales);
        } else {
          setLogs(logsGuardados);
        }

        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleConfirmClear = () => {
    localStorage.removeItem("logs_educa360");
    setLogs([]);
    setShowConfirm(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-black text-lg font-medium">Cargando registros de auditoría...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Barra superior */}
      <header className="max-w-5xl mx-auto bg-white p-4 rounded-xl shadow-md flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Educa360 - Panel de Auditoría</h1>
          <p className="text-xs text-gray-500">Trazabilidad y Registro de Actividad del Sistema</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push("/paciente/dashboard")}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md text-sm transition"
          >
            ← Volver al Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-sm transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <section className="max-w-5xl mx-auto space-y-6">
        
        {/* Descripción informativa */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-600">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Registro de Actividad y Seguridad 🛡️
          </h2>
          <p className="text-gray-700 text-sm">
            Aquí puedes visualizar el historial cronológico de acciones ejecutadas bajo tu cuenta de usuario ({user?.email}). Este registro permite auditar el acceso a los datos y las operaciones realizadas.
          </p>
        </div>

        {/* Tabla de Logs de Auditoría */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Historial de Eventos ({logs.length})</h3>
            {logs.length > 0 && !showConfirm && (
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Limpiar registros
              </button>
            )}
          </div>

          {/* Banner de confirmación integrado */}
          {showConfirm && (
            <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ ¿Estás seguro de que deseas vaciar todo el historial de auditoría? Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-2 shrink-0">
                <button
                  onClick={handleConfirmClear}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition"
                >
                  Sí, vaciar
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">
              No hay registros de auditoría almacenados actualmente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="py-3 px-4">Tipo de Acción</th>
                    <th className="py-3 px-4">Descripción del Suceso</th>
                    <th className="py-3 px-4">Fecha y Hora Exacta</th>
                    <th className="py-3 px-4">Usuario (UID)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-black">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-semibold">
                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-mono">
                          {log.accion}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800">{log.descripcion}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{log.fecha}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-400 truncate max-w-[120px]" title={user?.uid}>
                        {user?.uid}
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
