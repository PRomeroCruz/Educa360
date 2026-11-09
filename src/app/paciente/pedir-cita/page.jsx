"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function PedirCitaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [especialidad, setEspecialidad] = useState("Medicina General");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("09:00");
  const [motivo, setMotivo] = useState("");
  const [mensajeExito, setMensajeExito] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fecha || !hora) {
      alert("Por favor, selecciona una fecha y una hora válidas.");
      return;
    }

    const nuevaCita = {
      id: Date.now(),
      userId: user.uid,
      especialidad,
      fecha,
      hora,
      motivo: motivo.trim(),
      estado: "Pendiente",
    };

    const citasExistentes = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
    localStorage.setItem("citas_educa360", JSON.stringify([...citasExistentes, nuevaCita]));

    const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
    const nuevoLog = {
      id: Date.now(),
      accion: "CREAR_CITA",
      descripcion: `Se solicitó una cita de ${especialidad} para el ${fecha} a las ${hora}`,
      fecha: new Date().toLocaleString(),
      tipo: "success"
    };
    localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));

    setMensajeExito(true);

    setTimeout(() => {
      router.push("/paciente/dashboard");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-sm font-medium animate-pulse">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-5xl mx-auto bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Educa360 - Solicitud de Cita</h1>
          <p className="text-xs text-gray-500">Programación de servicios y atención especializada</p>
        </div>
        <button
          onClick={() => router.push("/paciente/dashboard")}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs transition"
        >
          ← Volver al Panel
        </button>
      </header>

      <section className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Formulario de Nueva Cita 📅
          </h2>
          <p className="text-gray-600 text-sm">
            Completa los detalles a continuación para solicitar tu cita en el sistema. Quedará en estado pendiente de validación.
          </p>
        </div>

        {mensajeExito && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium animate-fadeIn">
            ✅ ¡Cita solicitada con éxito! Redirigiendo a tu panel...
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Especialidad / Servicio
              </label>
              <select
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white text-gray-800"
              >
                <option value="Medicina General">Medicina General</option>
                <option value="Pediatría">Pediatría</option>
                <option value="Psicología">Psicología</option>
                <option value="Odontología">Odontología</option>
                <option value="Fisioterapia">Fisioterapia</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Fecha Prevista
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  required
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Observaciones o Motivo (Opcional)
              </label>
              <textarea
                rows="3"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indica breves detalles o síntomas relevantes..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-800"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
              >
                Confirmar y Solicitar Cita
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}