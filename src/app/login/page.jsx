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

    const redirigirSegunRol = async (user) => {
        try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                const rol = data.role;

                switch (rol) {
                    case "admin_sistema":
                        router.push("/admin/dashboard");
                        break;
                    case "profesional_sanitario":
                        router.push("/medico/dashboard");
                        break;
                    case "paciente":
                        router.push("/paciente/dashboard");
                        break;
                    case "admin":
                        router.push("/admin-general/dashboard");
                        break;
                    case "alumno_practicas":
                        router.push("/alumno/dashboard");
                        break;
                    case "editor_contenidos":
                        router.push("/editor/dashboard");
                        break;
                    default:
                        router.push("/paciente/dashboard");
                        break;
                }
            } else {
                router.push("/paciente/dashboard");
            }
        } catch (err) {
            console.error("Error al obtener el rol:", err);
            router.push("/paciente/dashboard");
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await signOut(auth);
                setError("Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.");
                setLoading(false);
                return;
            }

            const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
            const nuevoLog = {
                id: Date.now(),
                accion: "INICIO_SESION",
                userEmail: user.email,
                descripcion: "El usuario inició sesión correctamente en el sistema.",
                fecha: new Date().toLocaleString(),
                tipo: "success"
            };
            localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));

            await redirigirSegunRol(user);
        } catch (err) {
            console.error("Error en el login:", err);
            setError("Correo o contraseña incorrectos.");
            setLoading(false);
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

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="usuario@dominio.com"
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
                        {loading ? "Verificando acceso..." : "Iniciar Sesión"}
                    </button>
                </form>

                <div className="text-center pt-2 border-t border-slate-100 space-y-1">
                    <p className="text-[11px] text-slate-500">
                        ¿No tienes cuenta?{" "}
                        <a href="/register" className="text-blue-600 hover:underline font-semibold">
                            Regístrate aquí
                        </a>
                    </p>
                    <p className="text-[11px] text-slate-400">
                        Control de acceso basado en matriz de perfiles institucionales.
                    </p>
                </div>
            </div>
        </main>
    );
}