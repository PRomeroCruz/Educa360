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
        const horaFormatted = String(h).padStart(2, "0");
        const minFormatted = String(m).padStart(2, "0");
        lista.push(`${horaFormatted}:${minFormatted}`);
      }
    }

    for (let h = 17; h < 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        const horaFormatted = String(h).padStart(2, "0");
        const minFormatted = String(m).padStart(2, "0");
        lista.push(`${horaFormatted}:${minFormatted}`);
      }
    }

    return lista;
  }, []);

  const horasFiltradas = useMemo(() => {
    if (!fecha) return [];

    const citasGuardadas = JSON.parse(localStorage.getItem("citas_educa360") || "[]");

    const horasOcupadasEnFecha = citasGuardadas
      .filter((c) => c.fecha === fecha && (c.estado === "Pendiente" || c.estado === "Aceptada"))
      .map((c) => c.hora);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return bloquesBase.filter((item) => {
      if (horasOcupadasEnFecha.includes(item)) {
        return false;
      }

      if (fecha === hoyStr) {
        const [hStr, mStr] = item.split(":");
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);

        if (h < currentHour || (h === currentHour && m <= currentMinute)) {
          return false;
        }
      }

      return true;
    });
  }, [fecha, hoyStr, bloquesBase]);

  useEffect(() => {
    setHora("");
    setErrorValidacion("");

    if (fecha) {
      const [year, month, day] = fecha.split("-").map(Number);
      const fechaObj = new Date(year, month - 1, day);
      const diaSemana = fechaObj.getDay();

      if (diaSemana === 0 || diaSemana === 6) {
        setErrorValidacion("No se pueden coger citas los fines de semana (sábados y domingos). Por favor, seleccione un día laborable.");
      }
    }
  }, [fecha]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorValidacion("");

    if (!fecha || !hora) {
      alert("Por favor, selecciona una fecha y una hora válidas.");
      return;
    }

    const [year, month, day] = fecha.split("-").map(Number);
    const fechaObj = new Date(year, month - 1, day);
    const diaSemana = fechaObj.getDay();

    if (diaSemana === 0 || diaSemana === 6) {
      setErrorValidacion("No se pueden coger citas los fines de semana (sábados y domingos).");
      return;
    }

    const nuevaCita = {
      id: Date.now(),
      userId: user.uid,
      userEmail: user.email || "Paciente anónimo",
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
        <p className="text-slate-500 text-sm font-medium tracking-wide animate-pulse">Cargando formulario...</p>
      </div>
    );
  }

  const [y, mo, d] = fecha ? fecha.split("-").map(Number) : [0, 0, 0];
  const esFinDeSemana = fecha ? (new Date(y, mo - 1, d).getDay() === 0 || new Date(y, mo - 1, d).getDay() === 6) : false;

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
                Programación de servicios y atención especializada
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/paciente/dashboard")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700 shadow-sm"
          >
            ← Volver al Panel
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Módulo de Reservas
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Formulario de Nueva Cita</h2>
          <p className="text-slate-500 text-xs mt-0.5">Seleccione una fecha (Lunes a Viernes) y un bloque horario disponible (09:00 a 13:00 y 17:00 a 21:00).</p>
        </div>

        {mensajeExito && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
            ¡Cita solicitada con éxito! Redirigiendo a su panel...
          </div>
        )}

        {errorValidacion && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
            {errorValidacion}
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
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 bg-white transition"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Hora (Bloques de 15 min)
                </label>
                <select
                  required
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  disabled={!fecha || esFinDeSemana}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed transition"
                >
                  <option value="" disabled>
                    {!fecha ? "-- Primero selecciona una fecha --" : esFinDeSemana ? "-- Fines de semana no laborables --" : "-- Selecciona una hora --"}
                  </option>
                  {fecha && !esFinDeSemana && horasFiltradas.length === 0 ? (
                    <option value="" disabled>No hay horas disponibles para este día</option>
                  ) : (
                    horasFiltradas.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Observaciones o Motivo
              </label>
              <textarea
                rows="3"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indique breves detalles o síntomas relevantes..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 transition"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={!fecha || !hora || esFinDeSemana || horasFiltradas.length === 0}
                className={`px-5 py-2.5 text-white font-semibold text-xs rounded-lg shadow-sm transition ${
                  !fecha || !hora || esFinDeSemana || horasFiltradas.length === 0 ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
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