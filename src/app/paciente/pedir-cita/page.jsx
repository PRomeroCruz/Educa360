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

export default function PedirCitaPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthGuard("paciente");

    const [medicosDisponiblesDB, setMedicosDisponiblesDB] = useState([]);
    const [mapaDisponibilidad, setMapaDisponibilidad] = useState({});
    const [cargandoMedicos, setCargandoMedicos] = useState(true);

    const [especialidad, setEspecialidad] = useState("");
    const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [motivo, setMotivo] = useState("");
    
    const [horasDisponibles, setHorasDisponibles] = useState([]);
    const [fechaMinima, setFechaMinima] = useState("");
    const [mensajeAlerta, setMensajeAlerta] = useState({ texto: "", tipo: "info" });
    const [mensajeExito, setMensajeExito] = useState("");

    useEffect(() => {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, "0");
        const dd = String(hoy.getDate()).padStart(2, "0");
        setFechaMinima(`${yyyy}-${mm}-${dd}`);
    }, []);

    useEffect(() => {
        const obtenerMedicosEstrictosDePlantilla = async () => {
            try {
                const [snapDisp, snapProfPub, snapProfInt] = await Promise.all([
                    getDocs(collection(db, "disponibilidad_sedes")),
                    getDocs(collection(db, "profesionales_publicos")),
                    getDocs(collection(db, "profesionales"))
                ]);

                const dispMap = {};
                const pubMap = {};

                snapProfPub.forEach(docSnap => {
                    pubMap[docSnap.id.toLowerCase().trim()] = docSnap.data();
                });
                snapProfInt.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.email) {
                        const key = data.email.split("@")[0].toLowerCase().trim();
                        if (!pubMap[key]) pubMap[key] = data;
                    }
                });

                const medicosMap = new Map();

                snapDisp.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.profesionalId) {
                        const idProf = data.profesionalId.toLowerCase().trim();
                        dispMap[idProf] = data.horarios || [];

                        const perfil = pubMap[idProf] || pubMap[idProf.replace(/-/g, "")] || {};
                        
                        let nombre = perfil.nombre || perfil.public?.nombre;
                        let especialidadMed = perfil.especialidad || perfil.public?.especialidad || "Medicina General";
                        let email = perfil.email || `${idProf}@educa360.test`;

                        if (idProf === "medico-1") {
                            nombre = "Dra. Laura Martínez";
                            especialidadMed = "Medicina General";
                            email = "medico@educa360.test";
                        } else if (idProf === "medico-2") {
                            nombre = "Dr. Fernando José Martínez de la Torre y Gálvez";
                            especialidadMed = "Cardiología";
                            email = "medico2@educa360.test";
                        } else if (idProf === "medico-3") {
                            nombre = "Dra. Elena Ruiz-Sánchez";
                            especialidadMed = "Dermatología";
                            email = "medico3@educa360.test";
                        }

                        if (nombre && !nombre.startsWith("Facultativo (")) {
                            const claveUnica = email.toLowerCase().trim();
                            if (!medicosMap.has(claveUnica)) {
                                medicosMap.set(claveUnica, {
                                    id: idProf,
                                    email: email,
                                    nombre: nombre,
                                    especialidad: especialidadMed,
                                    matchKey: idProf
                                });
                            }
                        }
                    }
                });

                setMapaDisponibilidad(dispMap);
                setMedicosDisponiblesDB(Array.from(medicosMap.values()));
            } catch (error) {
                console.error("Error al cargar disponibilidad estricta:", error);
                setMedicosDisponiblesDB([]);
            } finally {
                setCargandoMedicos(false);
            }
        };

        obtenerMedicosEstrictosDePlantilla();
    }, []);

    const especialidadesDisponibles = Array.from(
        new Set(medicosDisponiblesDB.map(m => m.especialidad).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    const medicosFiltrados = medicosDisponiblesDB.filter(m => 
        !especialidad || (m.especialidad || "").toLowerCase() === especialidad.toLowerCase()
    );

    useEffect(() => {
        if (!fecha || !medicoSeleccionado) {
            setHorasDisponibles([]);
            return;
        }

        const [anio, mes, diaNum] = fecha.split("-").map(Number);
        const fechaObj = new Date(anio, mes - 1, diaNum);
        const diaSemanaIndex = fechaObj.getDay();

        if (diaSemanaIndex === 0 || diaSemanaIndex === 6) {
            setMensajeAlerta({
                texto: "Atención institucional: Los fines de semana no hay servicio de consulta ambulatoria disponible.",
                tipo: "error"
            });
            setFecha("");
            setHorasDisponibles([]);
            return;
        } else {
            setMensajeAlerta({ texto: "", tipo: "info" });
        }

        const diasSemanaNombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const nombreDiaSeleccionado = diasSemanaNombres[diaSemanaIndex];

        let horariosDelMedico = mapaDisponibilidad[medicoSeleccionado.matchKey] || [];
        
        if (horariosDelMedico.length === 0) {
            for (const [k, v] of Object.entries(mapaDisponibilidad)) {
                if (medicoSeleccionado.matchKey.includes(k) || k.includes(medicoSeleccionado.matchKey)) {
                    horariosDelMedico = v;
                    break;
                }
            }
        }

        const horarioDiaActual = horariosDelMedico.find(h => h.dia.toLowerCase() === nombreDiaSeleccionado.toLowerCase());

        let huecosCalculados = [];
        if (horarioDiaActual && horarioDiaActual.franjas) {
            horarioDiaActual.franjas.forEach(franja => {
                const [hInicio, mInicio] = franja.inicio.split(":").map(Number);
                const [hFin, mFin] = franja.fin.split(":").map(Number);
                const duracion = Number(franja.duracionCitaMinutos) || 20;

                let minutosActuales = hInicio * 60 + mInicio;
                const minutosFin = hFin * 60 + mFin;

                while (minutosActuales + duracion <= minutosFin) {
                    const hStr = String(Math.floor(minutosActuales / 60)).padStart(2, "0");
                    const mStr = String(minutosActuales % 60).padStart(2, "0");
                    huecosCalculados.push(`${hStr}:${mStr}`);
                    minutosActuales += duracion;
                }
            });
        }

        let horasOcupadas = new Set();
        try {
            const citasGlobales = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
            citasGlobales.forEach((c) => {
                const mismaFecha = c.fecha === fecha;
                const mismoMedico = (c.medico || "").toLowerCase() === medicoSeleccionado.email.toLowerCase() || 
                                  (c.medico || "").toLowerCase() === medicoSeleccionado.nombre.toLowerCase() ||
                                  (c.medico || "").toLowerCase() === medicoSeleccionado.id.toLowerCase();
                const estadoCita = (c.estado || "").toLowerCase();
                const estaOcupada = ["aceptada", "confirmada", "pendiente", "completada"].includes(estadoCita);

                if (mismaFecha && mismoMedico && estaOcupada) {
                    const horaLimpia = (c.hora || "").replace(" h", "").trim();
                    if (horaLimpia) horasOcupadas.add(horaLimpia);
                }
            });
        } catch (err) {
            console.error("Error al comprobar citas ocupadas:", err);
        }

        const ahora = new Date();
        const yyyy = ahora.getFullYear();
        const mm = String(ahora.getMonth() + 1).padStart(2, "0");
        const dd = String(ahora.getDate()).padStart(2, "0");
        const hoyStr = `${yyyy}-${mm}-${dd}`;

        const horasValidas = huecosCalculados.filter((hStr) => {
            if (horasOcupadas.has(hStr)) return false;

            if (fecha === hoyStr) {
                const [h, m] = hStr.split(":").map(Number);
                if (h < ahora.getHours() || (h === ahora.getHours() && m <= ahora.getMinutes())) {
                    return false;
                }
            }
            return true;
        });

        setHorasDisponibles(horasValidas);
        setHora(horasValidas.length > 0 ? horasValidas[0] : "");
    }, [fecha, medicoSeleccionado, mapaDisponibilidad]);

    const handleSolicitarCita = (e) => {
        e.preventDefault();
        if (!especialidad || !medicoSeleccionado || !fecha || !hora) return;

        const citasActuales = JSON.parse(localStorage.getItem("citas_educa360") || "[]");
        
        const nuevaCita = {
            id: Date.now(),
            userEmail: user?.email || "paciente@educa360.test",
            especialidad,
            medico: medicoSeleccionado.email,
            medicoNombre: medicoSeleccionado.nombre,
            fecha,
            hora: `${hora} h`,
            motivo: motivo.trim() || "Sin observaciones",
            estado: "Pendiente"
        };

        localStorage.setItem("citas_educa360", JSON.stringify([nuevaCita, ...citasActuales]));

        registrarLogSistema(
            "REGISTRO",
            user?.email || "paciente@educa360.test",
            `Nueva solicitud de cita médica (${especialidad} con ${medicoSeleccionado.nombre}) para el ${fecha} a las ${hora} h.`
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
                <EstadoCargando mensaje="Sincronizando cuadro médico con plantillas activas..." />
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
                        Seleccione especialidad, facultativo y franja horaria disponible en tiempo real según plantilla.
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

                <div className="p-4 rounded-2xl border bg-teal-50/70 border-teal-200 text-teal-900 text-xs space-y-2 shadow-xs">
                    <div className="flex items-center space-x-2 font-bold text-teal-800">
                        <span className="w-5 h-5 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center text-[10px]">i</span>
                        <span>Cuadro Clínico y Disponibilidad Horaria (Turnos de Mañana y Tarde)</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                        El sistema muestra exclusivamente a los profesionales con plantillas activas y calcula de forma automática los huecos disponibles correspondientes tanto a las franjas de mañana como a las de tarde configuradas en la sede.
                    </p>
                </div>

                <Tarjeta
                    titulo="Formulario de Reserva de Consulta"
                    subtitulo="Restringido exclusivamente a profesionales con disponibilidad activa."
                >
                    <form onSubmit={handleSolicitarCita} className="space-y-5 pt-2">
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">1. Especialidad Clínica</label>
                            <select
                                value={especialidad}
                                onChange={(e) => {
                                    setEspecialidad(e.target.value);
                                    setMedicoSeleccionado(null);
                                    setFecha("");
                                    setHora("");
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-teal-600"
                            >
                                <option value="">-- Seleccione una especialidad --</option>
                                {especialidadesDisponibles.length === 0 ? (
                                    <option value="" disabled>No hay especialidades con plantilla activa</option>
                                ) : (
                                    especialidadesDisponibles.map((esp) => (
                                        <option key={esp} value={esp}>{esp}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">2. Facultativo Asignado</label>
                            <select
                                value={medicoSeleccionado ? medicoSeleccionado.email : ""}
                                disabled={!especialidad}
                                onChange={(e) => {
                                    const encontrado = medicosFiltrados.find(m => m.email === e.target.value);
                                    setMedicoSeleccionado(encontrado || null);
                                    setFecha("");
                                    setHora("");
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-teal-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {!especialidad ? "Primero seleccione una especialidad..." : "-- Seleccione un facultativo --"}
                                </option>
                                {medicosFiltrados.map((m, index) => (
                                    <option key={`${m.email}-${index}`} value={m.email}>
                                        {m.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">3. Fecha de la Consulta</label>
                            <input
                                type="date"
                                min={fechaMinima}
                                disabled={!medicoSeleccionado}
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-teal-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">4. Hora Disponible (Turnos de Mañana y Tarde)</label>
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

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={!especialidad || !medicoSeleccionado || !fecha || horasDisponibles.length === 0}
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