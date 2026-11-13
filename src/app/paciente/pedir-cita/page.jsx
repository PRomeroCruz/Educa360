"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { Tarjeta } from "@/components/ComponentesUI";
import { EstadoCargando } from "@/components/EstadosUI";
import { registrarLogSistema } from "@/app/admin/dashboard/page";

const HORAS_BASE = [
    "09:00", "09:30", "10:00", "10:30", "11:00",
    "11:30", "12:00", "12:30", "16:00", "16:30", 
    "17:00", "17:30", "18:00", "18:30", "19:00", 
    "19:30", "20:00", "20:30", "21:00"
];

export default function PedirCitaPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthGuard("paciente");

    const [medicosDB, setMedicosDB] = useState([]);
    const [cargandoMedicos, setCargandoMedicos] = useState(true);

    const [especialidad, setEspecialidad] = useState("");
    const [medico, setMedico] = useState("");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [motivo, setMotivo] = useState("");
    
    const [horasDisponibles, setHorasDisponibles] = useState([]);
    const [fechaMinima, setFechaMinima] = useState("");
    const [mensajeAlerta, setMensajeAlerta] = useState({ texto: "", tipo: "info" });
    const [mensajeExito, setMensajeExito] = useState("");

    // Inicializar la fecha mínima con el día actual
    useEffect(() => {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, "0");
        const dd = String(hoy.getDate()).padStart(2, "0");
        setFechaMinima(`${yyyy}-${mm}-${dd}`);
    }, []);

    // Cargar los médicos reales desde la colección "profesionales" de Firestore
    useEffect(() => {
        const obtenerMedicosFirestore = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "profesionales"));
                const lista = [];
                
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    lista.push({
                        id: docSnap.id,
                        email: data.email || "Sin correo",
                        nombre: data.nombre || "Facultativo Médico",
                        especialidad: data.especialidad || "Medicina General"
                    });
                });

                setMedicosDB(lista);
            } catch (error) {
                console.error("Error al conectar con Firestore para obtener profesionales:", error);
                setMedicosDB([]);
            } finally {
                setCargandoMedicos(false);
            }
        };

        obtenerMedicosFirestore();
    }, []);

    // Extraer especialidades únicas de los profesionales reales de Firestore
    const especialidadesDisponibles = Array.from(
        new Set(medicosDB.map(m => m.especialidad).filter(Boolean))
    );

    // Filtrar médicos según la especialidad seleccionada
    const medicosFiltrados = medicosDB.filter(m => 
        !especialidad || (m.especialidad || "").toLowerCase() === especialidad.toLowerCase()
    );

    // Validación de fecha (bloqueo de fines de semana) y filtrado de horas ocupadas / pasadas
    useEffect(() => {
        if (!fecha || !medico) {
            setHorasDisponibles([]);
            return;
        }

        const [anio, mes, dia] = fecha.split("-").map(Number);
        const fechaObj = new Date(anio, mes - 1, dia);
        const diaSemana = fechaObj.getDay();

        // Bloquear fines de semana (Sábado = 6, Domingo = 0)
        if (diaSemana === 0 || diaSemana === 6) {
            setMensajeAlerta({
                texto: "Atención institucional: Los fines de semana (sábados y domingos) no hay servicio de consulta ambulatoria disponible. Por favor, seleccione un día laborable.",
                tipo: "error"
            });
            setFecha("");
            setHorasDisponibles([]);
            return;
        } else {
            setMensajeAlerta({ texto: "", tipo: "info" });
        }

        // Obtener citas ya registradas para bloquear horas ocupadas, aceptadas, confirmadas o completadas para este médico en esta fecha
        let horasOcupadas = new Set();
        try {
            const citasGlobales = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
            citasGlobales.forEach((c) => {
                const mismaFecha = c.fecha === fecha;
                const mismoMedico = (c.medico || "").toLowerCase() === medico.toLowerCase();
                const estadoCita = (c.estado || "").toLowerCase();

                // Si la cita está aceptada, confirmada, pendiente o completada, bloqueamos esa hora exacta
                const estaOcupada = estadoCita === "aceptada" || estadoCita === "confirmada" || estadoCita === "pendiente" || estadoCita === "completada";

                if (mismaFecha && mismoMedico && estaOcupada) {
                    // Limpiamos la hora por si viene con formato "12:00 h" o "12:00"
                    const horaLimpia = (c.hora || "").replace(" h", "").trim();
                    if (horaLimpia) horasOcupadas.add(horaLimpia);
                }
            });
        } catch (err) {
            console.error("Error al comprobar disponibilidad de horarios:", err);
        }

        const ahora = new Date();
        const yyyy = ahora.getFullYear();
        const mm = String(ahora.getMonth() + 1).padStart(2, "0");
        const dd = String(ahora.getDate()).padStart(2, "0");
        const hoyStr = `${yyyy}-${mm}-${dd}`;

        const horasValidas = HORAS_BASE.filter((hStr) => {
            // Descartar si ya está ocupada por otra cita del médico en esa fecha
            if (horasOcupadas.has(hStr)) return false;

            // Si es el día de hoy, descartar horas pasadas
            if (fecha === hoyStr) {
                const [h, m] = hStr.split(":").map(Number);
                const horaActual = ahora.getHours();
                const minutoActual = ahora.getMinutes();
                if (h < horaActual || (h === horaActual && m <= minutoActual)) {
                    return false;
                }
            }
            return true;
        });

        setHorasDisponibles(horasValidas);
        setHora(horasValidas.length > 0 ? horasValidas[0] : "");
    }, [fecha, medico]);

    const handleSolicitarCita = (e) => {
        e.preventDefault();
        if (!especialidad || !medico || !fecha || !hora) return;

        const citasActuales = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
        
        const nuevaCita = {
            id: Date.now(),
            userEmail: user?.email || "paciente@educa360.test",
            especialidad,
            medico,
            fecha,
            hora: `${hora} h`,
            motivo: motivo.trim() || "Sin observaciones",
            estado: "Pendiente"
        };

        localStorage.setItem("citas_educa360", JSON.stringify([nuevaCita, ...citasActuales]));

        registrarLogSistema(
            "REGISTRO",
            user?.email || "paciente@educa360.test",
            `Nueva solicitud de cita médica (${especialidad} con ${medico}) para el ${fecha} a las ${hora} h.`
        );

        setMensajeExito("Su solicitud de cita médica ha sido registrada correctamente en el sistema.");
        setMotivo("");
        setTimeout(() => setMensajeExito(""), 4000);
    };

    const handleCerrarSesion = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (authLoading || cargandoMedicos) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <EstadoCargando mensaje="Sincronizando cuadro médico institucional..." />
            </div>
        );
    }

    return (
        <PortalShell
            rolLabel="Portal Paciente"
            rolTipo="paciente"
            usuarioNombre="Paciente Registrado"
            usuarioEmail={user?.email || "paciente@educa360.test"}
            onLogout={handleCerrarSesion}
        >
            <div className="space-y-6 max-w-2xl mx-auto pb-10">
                <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                        Atención Ambulatoria
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                        Pedir Cita Médica
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Seleccione especialidad, facultativo y franja horaria disponible en tiempo real.
                    </p>
                </div>

                {mensajeExito && (
                    <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-3 shadow-xs">
                        <div className="w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                            ✓
                        </div>
                        <span>{mensajeExito}</span>
                    </div>
                )}

                {mensajeAlerta.texto && (
                    <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center space-x-3 shadow-xs ${
                        mensajeAlerta.tipo === "error" ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}>
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                            mensajeAlerta.tipo === "error" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                        }`}>
                            !
                        </div>
                        <span>{mensajeAlerta.texto}</span>
                    </div>
                )}

                {/* Recuadro de Horarios Disponibles */}
                <div className="p-4 rounded-2xl border bg-teal-50/70 border-teal-200 text-teal-900 text-xs space-y-2 shadow-xs">
                    <div className="flex items-center space-x-2 font-bold text-teal-800">
                        <span className="w-5 h-5 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center text-[10px]">i</span>
                        <span>Franjas Horarias Disponibles del Servicio Ambulatorio</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100">
                            <span className="font-bold block text-teal-700 uppercase tracking-wider text-[10px] mb-1">Turno de Mañana:</span>
                            <span className="text-slate-600">09:00 h — 12:30 h</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100">
                            <span className="font-bold block text-teal-700 uppercase tracking-wider text-[10px] mb-1">Turno de Tarde:</span>
                            <span className="text-slate-600">16:00 h — 21:00 h</span>
                        </div>
                    </div>
                </div>

                <Tarjeta
                    titulo="Formulario de Reserva de Consulta"
                    subtitulo="Las horas ocupadas o ya completadas por el facultativo se bloquean automáticamente."
                >
                    <form onSubmit={handleSolicitarCita} className="space-y-5 pt-2">
                        
                        {/* 1. SELECCIÓN DE ESPECIALIDAD */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">1. Especialidad Clínica</label>
                            <select
                                value={especialidad}
                                onChange={(e) => {
                                    setEspecialidad(e.target.value);
                                    setMedico("");
                                    setFecha("");
                                    setHora("");
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-teal-600"
                            >
                                <option value="">-- Seleccione una especialidad --</option>
                                {especialidadesDisponibles.length === 0 ? (
                                    <option value="" disabled>No hay especialidades registradas en el sistema</option>
                                ) : (
                                    especialidadesDisponibles.map((esp) => (
                                        <option key={esp} value={esp}>{esp}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* 2. SELECCIÓN DE MÉDICO */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">2. Facultativo Asignado</label>
                            <select
                                value={medico}
                                disabled={!especialidad}
                                onChange={(e) => {
                                    setMedico(e.target.value);
                                    setFecha("");
                                    setHora("");
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-teal-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {!especialidad ? "Primero seleccione una especialidad..." : "-- Seleccione un facultativo --"}
                                </option>
                                {medicosFiltrados.map((m) => (
                                    <option key={m.id || m.email} value={m.email}>
                                        {m.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. SELECCIÓN DE FECHA */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">3. Fecha de la Consulta</label>
                            <input
                                type="date"
                                min={fechaMinima}
                                disabled={!medico}
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-teal-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* 4. SELECCIÓN DE HORA */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">4. Hora Disponible</label>
                            {!fecha ? (
                                <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-xs">
                                    Primero seleccione una fecha válida...
                                </div>
                            ) : horasDisponibles.length === 0 ? (
                                <div className="px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs">
                                    No hay franjas horarias libres con este facultativo para la fecha seleccionada.
                                </div>
                            ) : (
                                <select
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:border-teal-600"
                                >
                                    {horasDisponibles.map((h) => (
                                        <option key={h} value={h}>
                                            {h} h
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* MOTIVO DE LA CONSULTA */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Motivo de la consulta (Opcional)</label>
                            <textarea
                                rows={3}
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Describa brevemente los síntomas o el motivo de su visita..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-teal-600"
                            />
                        </div>

                        {/* BOTÓN DE CONFIRMACIÓN */}
                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={!especialidad || !medico || !fecha || horasDisponibles.length === 0}
                                className="w-full py-3 bg-[#009688] hover:bg-[#00796b] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-700/20 transition cursor-pointer disabled:cursor-not-allowed"
                            >
                                Confirmar Solicitud de Cita
                            </button>
                        </div>
                    </form>
                </Tarjeta>
            </div>
        </PortalShell>
    );
}