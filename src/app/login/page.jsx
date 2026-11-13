"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { dashboardParaRol } from "@/lib/roles";

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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                let rolTemporal = "paciente";
                if (email.includes("admin")) rolTemporal = "admin";
                else if (email.includes("medico") || email.includes("profesional")) rolTemporal = "profesional_sanitario";
                else if (email.includes("editor")) rolTemporal = "editor";
                else if (email.includes("alumno")) rolTemporal = "alumno";

                router.push(`/register/verify-notice?email=${encodeURIComponent(user.email)}&role=${rolTemporal}`);
                return;
            }

            let rolFinal = localStorage.getItem(`rol_${user.email}`);

            if (!rolFinal) {
                try {
                    const userDocRef = doc(db, "usuarios", user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        rolFinal = userDoc.data().role;
                    }
                } catch (err) {
                    console.warn("No se pudo leer Firestore:", err);
                }
            }

            if (!rolFinal) {
                if (email.includes("admin")) rolFinal = "admin";
                else if (email.includes("medico") || email.includes("profesional")) rolFinal = "profesional_sanitario";
                else if (email.includes("editor")) rolFinal = "editor";
                else if (email.includes("alumno")) rolFinal = "alumno";
                else rolFinal = "paciente";
            }

            localStorage.setItem(`rol_${user.email}`, rolFinal);

            const emailLower = (user.email || "").toLowerCase();
            const roleLower = (rolFinal || "").toLowerCase();

            if (emailLower.includes("medico") || roleLower.includes("profesional") || roleLower.includes("medico")) {
                router.push(`/verify-2fa?email=${encodeURIComponent(user.email)}`);
                return;
            }

            router.push(dashboardParaRol(rolFinal));
        } catch (err) {
            console.error("Error en inicio de sesión:", err);
            setError("Credenciales incorrectas o usuario no registrado en el sistema.");
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 relative overflow-hidden antialiased">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-56 h-56 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-teal-900/40 mb-4">
            E
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
            Educa360 Salud
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1.5 tracking-wide">
            Plataforma Global de Gestión Clínica y Citas
            </p>
        </div>

        <div className="bg-[#f8fafc] rounded-[28px] shadow-2xl max-w-[440px] w-full p-8 sm:p-10 relative z-10">
            <div className="text-center space-y-1.5 mb-7">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Acceso al Portal Clínico
            </h2>
            <p className="text-xs text-slate-500">
                Introduzca sus credenciales para habilitar su sesión
            </p>
            </div>

            {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium text-center">
                {error}
            </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                CORREO ELECTRÓNICO
                </label>
                <input
                type="email"
                required
                placeholder="usuario@educa360.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10 focus:outline-hidden transition"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                CONTRASEÑA
                </label>
                <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10 focus:outline-hidden transition"
                />
            </div>

            <div className="pt-2">
                <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#009688] hover:bg-[#00796b] text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-700/25 transition cursor-pointer disabled:opacity-50"
                >
                {loading ? "Verificando credenciales..." : "Iniciar sesión segura"}
                </button>
            </div>
            </form>

            <div className="mt-7 pt-5 border-t border-slate-200/70 text-center">
            <p className="text-xs text-slate-500">
                ¿Aún no dispone de una cuenta?{" "}
                <a href="/register" className="font-bold text-[#009688] hover:underline">
                Regístrese aquí
                </a>
            </p>
            </div>
        </div>

        <p className="text-[10px] font-mono text-slate-500 mt-8 text-center relative z-10">
            Entorno protegido con cifrado TLS 1.3 · Control de acceso de doble factor
        </p>
        </main>
    );
}