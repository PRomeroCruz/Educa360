"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [requiere2FA, setRequiere2FA] = useState(false);
    const [codigo2FA, setCodigo2FA] = useState("");
    const [usuarioPendiente, setUsuarioPendiente] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const emailLower = email.toLowerCase();
            let rol = "paciente";

            if (emailLower.includes("adminsistema")) {
                rol = "admin_sistema";
            } else if (emailLower.includes("medico")) {
                rol = "profesional_sanitario";
            } else if (emailLower.includes("administracion")) {
                rol = "admin";
            } else if (emailLower.includes("alumno")) {
                rol = "alumno_practicas";
            } else if (emailLower.includes("editor")) {
                rol = "editor_contenidos";
            } else {
                const userDocRef = doc(db, "usuarios", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    rol = userDocSnap.data().role || "paciente";
                }
            }

            const rolLimpio = rol.toLowerCase().trim();

            if (rolLimpio === "profesional_sanitario" || rolLimpio.includes("medico")) {
                setUsuarioPendiente({ user, rol: rolLimpio });
                setRequiere2FA(true);
                setLoading(false);
                return;
            }

            completarRedireccion(user, rolLimpio);

        } catch (err) {
            console.error("Error en el login:", err);
            let mensajeAmigable = "Credenciales incorrectas o usuario no encontrado.";
            if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
                mensajeAmigable = "El correo o la contraseña son incorrectos.";
            } else if (err.code === "auth/wrong-password") {
                mensajeAmigable = "Contraseña incorrecta.";
            }
            setError(mensajeAmigable);
            setLoading(false);
        }
    };

    const handleValidar2FA = async (e) => {
        e.preventDefault();
        if (!codigo2FA || !usuarioPendiente) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: usuarioPendiente.user.uid,
                    code: codigo2FA
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Código 2FA no válido");
            }

            completarRedireccion(usuarioPendiente.user, usuarioPendiente.rol);

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const cancelar2FA = async () => {
        await signOut(auth);
        setRequiere2FA(false);
        setUsuarioPendiente(null);
        setCodigo2FA("");
        setError("");
    };

    const completarRedireccion = (user, rolLimpio) => {
        const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
        const nuevoLog = {
            id: Date.now(),
            accion: "INICIO_SESION_2FA",
            userEmail: user.email,
            descripcion: `Inicio de sesión verificado (2FA) para rol: ${rolLimpio}`,
            fecha: new Date().toLocaleString(),
            tipo: "success"
        };
        localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));

        if (rolLimpio === "admin_sistema") {
            router.push("/admin/dashboard");
        } else if (rolLimpio === "profesional_sanitario" || rolLimpio.includes("medico")) {
            router.push("/medico/dashboard");
        } else if (rolLimpio === "admin") {
            router.push("/admin-general/dashboard");
        } else if (rolLimpio === "alumno_practicas") {
            router.push("/alumno/dashboard");
        } else if (rolLimpio === "editor_contenidos") {
            router.push("/editor/dashboard");
        } else {
            router.push("/paciente/dashboard");
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-slate-800">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-md">
                        E
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Educa360
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                        Plataforma Segura de Gestión Institucional y Sanitaria
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
                        {error}
                    </div>
                )}

                {requiere2FA ? (
                    <form onSubmit={handleValidar2FA} className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 text-center flex flex-col items-center justify-center">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                                Verificación Requerida
                            </span>
                            <p className="text-xs font-semibold text-slate-800 mt-1">
                                Perfil Clínico Detectado ({usuarioPendiente?.user?.email})
                            </p>
                            <p className="text-[11px] text-slate-600 max-w-xs">
                                Por seguridad, introduce el código temporal de 6 dígitos de tu app de autenticación (TOTP) o una clave de recuperación.
                            </p>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 text-center">
                                Código de Verificación (2FA)
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={10}
                                placeholder="123456"
                                value={codigo2FA}
                                onChange={(e) => setCodigo2FA(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-center font-mono font-bold tracking-widest text-slate-800 focus:outline-none focus:border-blue-600 transition shadow-sm"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={cancelar2FA}
                                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-md transition disabled:opacity-50"
                            >
                                {loading ? "Verificando..." : "Verificar 2FA"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="usuario@educa360.test"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 transition shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 transition shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-md transition disabled:opacity-50"
                        >
                            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </button>
                    </form>
                )}

                <div className="text-center pt-2 border-t border-slate-100 space-y-1">
                    <p className="text-[11px] text-slate-500">
                        ¿No tienes una cuenta?{" "}
                        <a href="/register" className="text-blue-600 hover:underline font-semibold">
                            Regístrate aquí
                        </a>
                    </p>
                    <p className="text-[11px] text-slate-400">
                        Control de acceso con segundo factor obligatorio para perfiles sanitarios.
                    </p>
                </div>
            </div>
        </main>
    );
}