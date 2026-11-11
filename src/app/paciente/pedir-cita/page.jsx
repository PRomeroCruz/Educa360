"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function PedirCitaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [especialidad, setEspecialidad] = useState("Medicina General");
  
  const hoyStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

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

  const bloquesBase = useMemo(() => {
    const lista = [];
    for (let h = 9; h < 13; h++) {
      for (let m = 0; m < 60; m += 15) {
        lista.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    for (let h = 17; h < 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        lista.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return lista;
  }, []);

  const horasFiltradas = useMemo(() => {
    if (!fecha) return [];
    const citasGuardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");

    const horasOcupadasEnFecha = citasGuardadas
      .filter((c) => {
        if (c.fecha !== fecha) return false;
        const estadoLC = (c.estado || "").toLowerCase();
        if (estadoLC.includes("cancel") || estadoLC.includes("anul")) return false;
        return true;
      })
      .map((c) => c.hora);

    return bloquesBase.filter((item) => !horasOcupadasEnFecha.includes(item));
  }, [fecha, bloquesBase]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorValidacion("");

    if (!fecha || !hora) {
      alert("Por favor, selecciona una fecha y una hora válidas.");
      return;
    }

    const nuevaCita = {
      id: Date.now(),
      userId: user.uid,
      userEmail: user.email || "Paciente anónimo",
      especialidad: especialidad,
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
      userEmail: user.email || "Paciente anónimo",
      descripcion: `Se solicitó una nueva cita de ${especialidad} para el ${fecha} a las ${hora}`,
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
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500 text-sm font-medium animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Educa360</h1>
              <p className="text-[11px] text-slate-400">Programación de servicios</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/paciente/dashboard")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700"
          >
            ← Volver al Panel
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Formulario de Nueva Cita</h2>
          <p className="text-slate-500 text-xs mt-0.5">Seleccione la especialidad y el horario deseado.</p>
        </div>

        {mensajeExito && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
            ¡Cita solicitada con éxito! Redirigiendo...
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Especialidad / Servicio
              </label>
              <select
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-600 transition"
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
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Fecha Prevista
                </label>
                <input
                  type="date"
                  required
                  min={hoyStr}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Hora
                </label>
                <select
                  required
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  disabled={!fecha}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 disabled:bg-slate-100"
                >
                  <option value="" disabled>-- Selecciona una hora --</option>
                  {horasFiltradas.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Motivo
              </label>
              <textarea
                rows="3"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Detalles relevantes..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs text-slate-800"
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