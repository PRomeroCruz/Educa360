"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function PedirCitaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    especialidad: "Psicología Educativa",
    fecha: "",
    hora: "",
    motivo: "",
  });

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");

    // 1. Crear el objeto de la nueva cita
    const nuevaCita = {
      id: Date.now(),
      especialidad: formData.especialidad,
      fecha: formData.fecha,
      hora: formData.hora,
      estado: "Pendiente",
      motivo: formData.motivo,
    };

    // 2. Guardar la cita en localStorage
    const citasGuardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
    localStorage.setItem("citas_educa360", JSON.stringify([nuevaCita, ...citasGuardadas]));

    // 3. Registrar la acción automáticamente en la Auditoría
    const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
    const nuevoLog = {
      id: Date.now() + 1,
      accion: "CREAR_CITA",
      descripcion: `Solicitud de cita para ${formData.especialidad} (${formData.fecha} a las ${formData.hora})`,
      fecha: new Date().toLocaleString(),
      tipo: "success"
    };
    localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));

    // 4. Feedback visual y redirección
    setTimeout(() => {
      setSubmitting(false);
      setSuccessMessage("¡Cita solicitada con éxito! Redirigiendo al panel...");
      
      setTimeout(() => {
        router.push("/paciente/dashboard");
      }, 1500);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-black text-lg font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-md">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pedir Nueva Cita</h1>
          <button
            onClick={() => router.push("/paciente/dashboard")}
            className="text-sm text-blue-600 hover:underline focus:outline-none"
          >
            ← Volver al Panel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-1">
              Especialidad o Servicio
            </label>
            <select
              id="especialidad"
              value={formData.especialidad}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-black bg-white"
            >
              <option value="Psicología Educativa">Psicología Educativa</option>
              <option value="Orientación Vocacional">Orientación Vocacional</option>
              <option value="Logopedia y Apoyo">Logopedia y Apoyo</option>
              <option value="Terapia Ocupacional">Terapia Ocupacional</option>
            </select>
          </div>

          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha deseada
            </label>
            <input
              id="fecha"
              type="date"
              required
              value={formData.fecha}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-black"
            />
          </div>

          <div>
            <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-1">
              Hora preferida
            </label>
            <input
              id="hora"
              type="time"
              required
              value={formData.hora}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-black"
            />
          </div>

          <div>
            <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo u Observaciones (Opcional)
            </label>
            <textarea
              id="motivo"
              rows="3"
              value={formData.motivo}
              onChange={handleChange}
              placeholder="Indique brevemente el motivo de su consulta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-black placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
          >
            {submitting ? "Guardando cita..." : "Confirmar Solicitud de Cita"}
          </button>
        </form>

        {successMessage && (
          <div className="mt-4 p-3 rounded-md text-sm bg-green-50 text-green-700 border border-green-200 text-center" role="alert">
            {successMessage}
          </div>
        )}

      </div>
    </main>
  );
}
