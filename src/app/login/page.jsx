"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/paciente/dashboard");
        } catch (err) {
            console.error("Error de autenticación:", err);
            setError("Correo o contraseña incorrectos. Por favor, verifica tus datos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-base shadow-sm">
                        E
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        Educa360 // Acceso Institucional
                    </h1>
                    <p className="text-xs text-slate-500">
                        Introduce tus credenciales para acceder a la plataforma
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="usuario@dominio.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-600 transition"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-600 transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                        {loading ? "Verificando credenciales..." : "Entrar al Sistema"}
                    </button>
                </form>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                    <a href="#" className="text-slate-500 hover:text-blue-600 transition font-medium">
                        ¿Has olvidado tu contraseña?
                    </a>
                    <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition">
                        Regístrate
                    </a>
                </div>
            </div>
        </main>
    );
}