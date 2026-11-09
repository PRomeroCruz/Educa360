"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, deleteUser } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

export default function RegisterPage() {
    const router = useRouter();
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        let createdUser = null;

        try {
            if (password.length < 6) {
                throw new Error("La contraseña debe tener al menos 6 caracteres.");
            }

            const telefonoLimpio = String(telefono).trim();
            if (!telefonoLimpio.startsWith("+")) {
                throw new Error("El número de teléfono debe incluir el prefijo internacional (ej. +34).");
            }

            const usuariosRef = collection(db, "usuarios");
            const qTelefono = query(usuariosRef, where("telefono", "==", telefonoLimpio));
            const querySnapshot = await getDocs(qTelefono);

            if (!querySnapshot.empty) {
                throw new Error("Este número de teléfono ya está registrado por otro usuario.");
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            createdUser = userCredential.user;

            await updateProfile(createdUser, {
                displayName: nombre
            });

            await setDoc(doc(db, "usuarios", createdUser.uid), {
                uid: createdUser.uid,
                nombre: nombre,
                email: email,
                telefono: telefonoLimpio,
                role: "paciente",
                createdAt: new Date().toISOString()
            });

            const response = await fetch("/api/update-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: createdUser.uid,
                    telefono: telefonoLimpio
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar el teléfono en Authentication.");
            }

            router.push("/paciente/dashboard");

        } catch (err) {
            if (createdUser) {
                try { await deleteUser(createdUser); } catch (delErr) {}
            }
            
            let mensajeError = err.message;
            
            if (err.code === "auth/email-already-in-use") {
                mensajeError = "Este correo electrónico ya está registrado.";
            } else if (err.code === "auth/weak-password") {
                mensajeError = "La contraseña debe tener al menos 6 caracteres.";
            }

            setError(mensajeError);
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
                        Educa360
                    </h1>
                    <p className="text-xs text-slate-500">
                        Crea tu perfil institucional para acceder al sistema
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Nombre Apellido"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-600 transition"
                        />
                    </div>

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
                            Número de Teléfono
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="+34 600 000 000"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
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
                            placeholder="Mínimo 6 caracteres"
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
                        {loading ? "Creando perfil..." : "Completar Registro"}
                    </button>
                </form>

                <div className="text-center text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-500">¿Ya tienes una cuenta? </span>
                    <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition">
                        Iniciar Sesión
                    </a>
                </div>
            </div>
        </main>
    );
}