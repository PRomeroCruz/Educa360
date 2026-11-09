"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function AuditoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        const idTokenResult = await currentUser.getIdTokenResult(true);
        if (idTokenResult.claims.role !== "admin") {
          router.push("/paciente/dashboard");
          return;
        }

        const logsGuardados = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
        setLogs(logsGuardados);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleConfirmarLimpieza = () => {
    localStorage.removeItem("logs_educa360");
    setLogs([]);
    setMostrarConfirmacion(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-sm font-medium animate-pulse">Cargando auditoría...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-5xl mx-auto bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Educa360 - Registro de Auditoría</h1>
          <p className="text-xs text-gray-500">Trazabilidad y eventos del sistema</p>
        </div>
        <div className="flex space-x-2">
          {logs.length > 0 && (
            <button
              onClick={() => setMostrarConfirmacion(true)}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-xs transition"
            >
              Limpiar Registro
            </button>
          )}
          <button
            onClick={() => router.push("/paciente/dashboard")}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs transition"
          >
            ← Volver al Panel
          </button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-indigo-600">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Historial de Eventos 🛡️</h2>
          <p className="text-gray-600 text-sm">Visualiza las acciones ejecutadas en la plataforma.</p>
        </div>

        {mostrarConfirmacion && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 animate-fadeIn">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ ¿Estás seguro de que deseas vaciar todo el registro de auditoría? Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-2 shrink-0">
              <button
                onClick={handleConfirmarLimpieza}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition"
              >
                Sí, limpiar
              </button>
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-md transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-900">Logs del Sistema</h3>
            <span className="text-xs text-gray-500">
              {logs.length === 1 ? "1 evento registrado" : `${logs.length} eventos registrados`}
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg">
              No hay registros de auditoría en este momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Acción</th>
                    <th className="py-3 px-4">Usuario (Correo)</th>
                    <th className="py-3 px-4">Descripción del Suceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 text-xs text-gray-500">{log.fecha}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-mono font-semibold">
                          {log.accion}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {log.userEmail || "Sistema / Anónimo"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {log.descripcion}
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