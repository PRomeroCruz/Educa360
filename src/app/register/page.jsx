"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, deleteUser } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

const ROLES_DISPONIBLES = [
    { valor: "paciente", etiqueta: "Paciente" },
    { valor: "profesional_sanitario", etiqueta: "Profesional Sanitario" },
    { valor: "alumno_practicas", etiqueta: "Alumno en Prácticas" },
    { valor: "admin", etiqueta: "Administrador General" },
    { valor: "admin_sistema", etiqueta: "Administrador del Sistema" },
    { valor: "editor_contenidos", etiqueta: "Editor de Contenidos" },
];

export default function RegisterPage() {
    const router = useRouter();
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [password, setPassword] = useState("");
    const [rolSeleccionado, setRolSeleccionado] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        let createdUser = null;

        try {
            if (!rolSeleccionado) {
                throw new Error("Por favor, selecciona un rol institucional.");
            }

            if (password.length < 6) {
                throw new Error("La contraseña debe tener al menos 6 caracteres.");
            }

            const telefonoLimpio = String(telefono).trim();
            if (!telefonoLimpio.startsWith("+")) {
                throw new Error("El número de teléfono debe incluir el prefijo internacional (ej. +34612345678).");
            }

            const soloDigitos = telefonoLimpio.replace("+", "").replace(/[^0-9]/g, "");
            
            if (soloDigitos.length < 11) {
                throw new Error("El número de teléfono debe tener al menos 9 dígitos después del prefijo.");
            }

            const usuariosRef = collection(db, "usuarios");
            const qTelefono = query(usuariosRef, where("telefono", "==", telefonoLimpio));
            const querySnapshotTelefono = await getDocs(qTelefono);

            if (!querySnapshotTelefono.empty) {
                throw new Error("Este número de teléfono ya está registrado por otro usuario.");
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            createdUser = userCredential.user;

            await updateProfile(createdUser, {
                displayName: nombre
            });

            const customClaimsJson = { role: rolSeleccionado };
            await setDoc(doc(db, "usuarios", createdUser.uid), {
                uid: createdUser.uid,
                nombre: nombre,
                email: email,
                telefono: telefonoLimpio,
                role: rolSeleccionado,
                customClaims: customClaimsJson,
                createdAt: new Date().toISOString()
            });

            const response = await fetch("/api/update-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: createdUser.uid,
                    telefono: telefonoLimpio,
                    role: rolSeleccionado
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar los datos en Authentication.");
            }

            const logsActuales = JSON.parse(localStorage.getItem("logs_educa360") || "[]");
            const nuevoLog = {
                id: Date.now(),
                accion: "REGISTRO_USUARIO",
                userEmail: createdUser.email,
                descripcion: `Registro completado. Rol: ${rolSeleccionado} | Teléfono: ${telefonoLimpio}`,
                fecha: new Date().toLocaleString(),
                tipo: "success"
            };
            localStorage.setItem("logs_educa360", JSON.stringify([nuevoLog, ...logsActuales]));

            router.push("/login");

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
        <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-8">
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

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Juan Pérez"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 transition shadow-sm"
                        />
                    </div>

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
                            Perfil / Rol Institucional
                        </label>
                        <select
                            value={rolSeleccionado}
                            onChange={(e) => setRolSeleccionado(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-medium focus:outline-none focus:border-blue-600 transition shadow-sm cursor-pointer"
                        >
                            <option value="" disabled>
                                Selecciona tu rol
                            </option>
                            {ROLES_DISPONIBLES.map((r) => (
                                <option key={r.valor} value={r.valor}>
                                    {r.etiqueta}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Número de Teléfono (con prefijo, ej. +34612345678)
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="+34612345678"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
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
                            placeholder="Mínimo 6 caracteres"
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
                        {loading ? "Creando cuenta..." : "Crear Cuenta"}
                    </button>
                </form>

                <div className="text-center pt-2 border-t border-slate-100 space-y-1">
                    <p className="text-[11px] text-slate-500">
                        ¿Ya tienes cuenta?{" "}
                        <a href="/login" className="text-blue-600 hover:underline font-semibold">
                            Inicia sesión aquí
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