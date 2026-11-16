"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

export default function AdminDisponibilidadPage() {
    const router = useRouter();
    const [disponibilidades, setDisponibilidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    const [profesionalId, setProfesionalId] = useState("medico-1");
    const [sedeId, setSedeId] = useState("seed-sede-centro");
    const [dia, setDia] = useState("Lunes");
    const [inicio, setInicio] = useState("09:00");
    const [fin, setFin] = useState("13:00");
    const [duracion, setDuracion] = useState(20);

    useEffect(() => {
        async function fetchDisponibilidades() {
            try {
                const querySnapshot = await getDocs(collection(db, "disponibilidad_sedes"));
                const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDisponibilidades(lista);
            } catch (err) {
                console.error("Error al cargar disponibilidades:", err);
                setError("No se pudieron cargar las disponibilidades de la base de datos.");
            } finally {
                setLoading(false);
            }
        }
        fetchDisponibilidades();
    }, []);

    const horaAMinutos = (horaStr) => {
        const [h, m] = horaStr.split(":").map(Number);
        return h * 60 + m;
    };

    const validarSolapamiento = (horariosActuales, nuevoDia, nuevaFranja) => {
        // Validación de fin de semana (Sábado y Domingo)
        if (nuevoDia === "Sábado" || nuevoDia === "Domingo") {
            throw new Error("No se permite programar disponibilidad en fines de semana (Sábado y Domingo).");
        }

        const inicioNuevo = horaAMinutos(nuevaFranja.inicio);
        const finNuevo = horaAMinutos(nuevaFranja.fin);

        if (inicioNuevo >= finNuevo) {
            throw new Error("La hora de inicio debe ser anterior a la hora de fin.");
        }

        const diaExistente = horariosActuales.find(h => h.dia === nuevoDia);
        if (!diaExistente) return horariosActuales;

        for (const franja of diaExistente.franjas) {
            const inicioExistente = horaAMinutos(franja.inicio);
            const finExistente = horaAMinutos(franja.fin);

            if (inicioNuevo < finExistente && finNuevo > inicioExistente) {
                throw new Error(`Conflicto de solapamiento: La franja ${nuevaFranja.inicio}-${nuevaFranja.fin} se solapa con otra existente (${franja.inicio}-${franja.fin}) el ${nuevoDia}.`);
            }
        }

        return horariosActuales;
    };

    const handleGuardarDisponibilidad = async (e) => {
        e.preventDefault();
        setMensaje("");
        setError("");

        try {
            const docId = `disp-${profesionalId}-${sedeId}`;
            const existente = disponibilidades.find(d => d.id === docId);
            let horariosActuales = existente ? [...existente.horarios] : [];

            const nuevaFranjaObjeto = { 
                inicio, 
                fin, 
                duracionCitaMinutos: Number(duracion) 
            };

            validarSolapamiento(horariosActuales, dia, nuevaFranjaObjeto);

            let indexDia = horariosActuales.findIndex(h => h.dia === dia);
            if (indexDia >= 0) {
                horariosActuales[indexDia].franjas.push(nuevaFranjaObjeto);
            } else {
                horariosActuales.push({
                    dia,
                    franjas: [nuevaFranjaObjeto]
                });
            }

            const payload = {
                profesionalId,
                sedeId,
                horarios: horariosActuales
            };

            await setDoc(doc(db, "disponibilidad_sedes", docId), payload, { merge: true });

            setMensaje("Plantilla de disponibilidad guardada y validada correctamente.");
            
            setDisponibilidades(prev => {
                const filtrado = prev.filter(p => p.id !== docId);
                return [...filtrado, { id: docId, ...payload }];
            });

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pt-6 pb-12 space-y-6 antialiased">
            
            {/* Tarjeta de Cabecera Superior */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-teal-50 text-[#009688] text-[10px] font-bold uppercase tracking-wider rounded-lg border border-teal-200/60 font-mono">
                            ÁREA CLÍNICA ASISTENCIAL
                        </span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-mono rounded-lg">
                            TLS 1.3 Seguro
                        </span>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Plantillas de Disponibilidad</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Gestión de turnos, franjas horarias y validación anti-solapamientos por profesional y sede.</p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/admin/dashboard")}
                    className="px-5 py-3 bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 transition cursor-pointer flex items-center gap-2 shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Volver al Panel</span>
                </button>
            </div>

            {mensaje && (
                <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-2xl font-medium shadow-sm">
                    {mensaje}
                </div>
            )}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium shadow-sm">
                    {error}
                </div>
            )}

            {/* Contenido Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Columna Izquierda: Formulario (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-[28px] p-6 shadow-sm border border-slate-200/80 space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                        <h2 className="text-sm font-bold text-slate-900">Añadir Franja Horaria</h2>
                        <p className="text-[11px] text-slate-500">Configura un nuevo bloque institucional (Solo Días Laborables).</p>
                    </div>
                    
                    <form onSubmit={handleGuardarDisponibilidad} className="space-y-3.5">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">ID Profesional</label>
                            <input
                                type="text"
                                value={profesionalId}
                                onChange={(e) => setProfesionalId(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10 focus:outline-none transition"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">ID Sede</label>
                            <input
                                type="text"
                                value={sedeId}
                                onChange={(e) => setSedeId(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10 focus:outline-none transition"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Día de la Semana (Laborable)</label>
                            <select
                                value={dia}
                                onChange={(e) => setDia(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10 focus:outline-none transition cursor-pointer"
                            >
                                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Inicio</label>
                                <input
                                    type="time"
                                    value={inicio}
                                    onChange={(e) => setInicio(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10 focus:outline-none transition"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Fin</label>
                                <input
                                    type="time"
                                    value={fin}
                                    onChange={(e) => setFin(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10 focus:outline-none transition"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Duración Cita (minutos)</label>
                            <input
                                type="number"
                                value={duracion}
                                onChange={(e) => setDuracion(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10 focus:outline-none transition"
                                min="5"
                                max="120"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-[#009688] hover:bg-[#00796b] text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-700/20 transition cursor-pointer mt-1"
                        >
                            Guardar y Validar Franja
                        </button>
                    </form>
                </div>

                {/* Columna Derecha: Listado de Plantillas (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-[24px] px-6 py-3.5 border border-slate-200/80 shadow-sm flex justify-between items-center">
                        <div>
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Plantillas Registradas</h2>
                            <p className="text-[11px] text-slate-500">Control y visualización de franjas institucionales.</p>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-mono font-bold rounded-lg">
                            {disponibilidades.length} Activa(s)
                        </span>
                    </div>
                    
                    {loading ? (
                        <div className="bg-white p-8 rounded-[28px] border border-slate-200/80 text-center text-xs text-slate-500 shadow-sm">
                            Cargando plantillas desde la base de datos...
                        </div>
                    ) : disponibilidades.length === 0 ? (
                        <div className="bg-white p-8 rounded-[28px] border border-slate-200/80 text-center text-xs text-slate-500 shadow-sm">
                            No hay plantillas de disponibilidad registradas todavía.
                        </div>
                    ) : (
                        disponibilidades.map(item => (
                            <div key={item.id} className="bg-white border border-slate-200/80 rounded-[28px] p-6 space-y-4 shadow-sm">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                    <div>
                                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                            Profesional: <span className="text-[#009688]">{item.profesionalId}</span>
                                        </span>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Sede asignada: <span className="font-mono">{item.sedeId}</span></p>
                                    </div>
                                    <span className="px-3 py-1 bg-teal-50 text-[#009688] text-[10px] font-bold rounded-lg border border-teal-200/60 shadow-2xs">
                                        Activa
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {item.horarios.map((h, idx) => (
                                        <div key={idx} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60 space-y-2">
                                            <span className="text-xs font-bold text-slate-800 block border-b border-slate-200/60 pb-1.5">{h.dia}</span>
                                            <div className="space-y-1.5">
                                                {h.franjas.map((f, fIdx) => (
                                                    <div key={fIdx} className="flex justify-between items-center text-[11px] font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                                        <span className="text-slate-700 font-semibold">{f.inicio} - {f.fin}</span>
                                                        <span className="text-[#009688] font-bold bg-teal-50 px-2 py-0.5 rounded text-[10px]">{f.duracionCitaMinutos} min</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}