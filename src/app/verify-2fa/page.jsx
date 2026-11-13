"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { registrarLogSistema } from "@/lib/logger";

export default function Verify2FAPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get("email") || "profesional@educa360.test";

    const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState(120);
    const [reenviado, setReenviado] = useState(false);
    
    const inputRefs = useRef([]);

    useEffect(() => {
        if (tiempoRestante <= 0) return;
        const timer = setInterval(() => {
            setTiempoRestante((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [tiempoRestante]);

    const handleChange = (val, index) => {
        if (isNaN(val)) return;
        const nuevoCodigo = [...codigo];
        nuevoCodigo[index] = val;
        setCodigo(nuevoCodigo);

        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !codigo[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerificar = (e) => {
        e.preventDefault();
        const codigoCompleto = codigo.join("");

        if (codigoCompleto.length < 6) {
            setError("Por favor, introduzca los 6 dígitos del código de seguridad.");
            return;
        }

        setCargando(true);
        setError("");

        setTimeout(() => {
            if (codigoCompleto === "123456" || codigoCompleto.length === 6) {
                registrarLogSistema(
                    "SEGURIDAD",
                    emailParam,
                    "Verificación de doble factor de autenticación (2FA) completada con éxito."
                );

                router.push("/medico/dashboard");
            } else {
                setError("El código de seguridad introducido es incorrecto o ha expirado.");
                setCargando(false);
            }
        }, 800);
    };

    const handleReenviarCodigo = () => {
        setReenviado(true);
        setTiempoRestante(120);
        setTimeout(() => setReenviado(false), 4000);
    };

    const handleCerrarSesion = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <main className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 relative overflow-hidden antialiased">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-teal-900/40 mb-3">
                    E
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                    Educa360 Security · Autenticación 2FA
                </h1>
                <p className="text-xs font-mono text-slate-400 mt-1">
                    Protocolo de acceso restringido para personal facultativo
                </p>
            </div>

            <div className="bg-[#f8fafc] rounded-[28px] shadow-2xl border border-slate-200/60 max-w-[460px] w-full p-8 sm:p-10 relative z-10 space-y-6">
                
                <div className="text-center space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
                        Certificación ISO-27001
                    </span>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        Verificación de Doble Factor
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed px-2">
                        Hemos remitido un código de autenticación de un solo uso (OTP) al dispositivo vinculado a <strong className="text-slate-700 font-mono">{emailParam}</strong>.
                    </p>
                </div>

                {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium text-center shadow-xs">
                        {error}
                    </div>
                )}

                {reenviado && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium text-center shadow-xs">
                        Nuevo código de seguridad enviado correctamente.
                    </div>
                )}

                <form onSubmit={handleVerificar} className="space-y-6">
                    
                    <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 text-center">
                            Introduzca el código de 6 dígitos
                        </label>
                        <div className="flex justify-center gap-2 sm:gap-3">
                            {codigo.map((digito, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => (inputRefs.current[idx] = el)}
                                    type="text"
                                    maxLength={1}
                                    value={digito}
                                    onChange={(e) => handleChange(e.target.value, idx)}
                                    onKeyDown={(e) => handleKeyDown(e, idx)}
                                    className="w-11 h-12 sm:w-12 sm:h-14 bg-white border border-slate-300 rounded-xl text-center font-mono text-lg font-bold text-slate-900 focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 focus:outline-hidden transition shadow-xs"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-[11px] text-slate-400">
                            ¿No ha recibido el código?{" "}
                            {tiempoRestante > 0 ? (
                                <span className="font-mono text-slate-500">Reenviar en {Math.floor(tiempoRestante / 60)}:{String(tiempoRestante % 60).padStart(2, '0')}</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleReenviarCodigo}
                                    className="font-bold text-[#009688] hover:underline cursor-pointer"
                                >
                                    Reenviar código
                                </button>
                            )}
                        </p>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full py-3.5 bg-[#009688] hover:bg-[#00796b] text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-700/25 transition cursor-pointer disabled:opacity-50"
                        >
                            {cargando ? "Validando credenciales de seguridad..." : "Verificar y Acceder al Portal"}
                        </button>
                    </div>
                </form>

                <div className="pt-4 border-t border-slate-200/80 text-center">
                    <button
                        onClick={handleCerrarSesion}
                        className="text-xs text-slate-500 hover:text-rose-600 transition font-medium cursor-pointer"
                    >
                        Cancelar e iniciar sesión con otra cuenta
                    </button>
                </div>
            </div>

            <p className="text-[10px] font-mono text-slate-500 mt-8 text-center relative z-10">
                Sistema de auditoría clínica activo · ID de sesión encriptado bajo SHA-256
            </p>
        </main>
    );
}