"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.email, 
            formData.password
        );
        const user = userCredential.user;
        await updateProfile(user, {
            displayName: formData.name,
        });

        await sendEmailVerification(user);
        router.push("/register/verify-notice");

        } catch (err) {
        console.error("Error en el registro:", err.code);
        if (err.code === "auth/email-already-in-use") {
            setError("Este correo ya está registrado.");
        } else if (err.code === "auth/weak-password") {
            setError("La contraseña debe tener al menos 6 caracteres.");
        } else {
            setError("Hubo un error al registrarse. Comprueba los datos.");
        }
        } finally {
        setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
            
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Registro - educa360
            </h1>

            <form onSubmit={handleRegister} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
                </label>
                <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-black placeholder:text-black"
                placeholder="Tu nombre"
                disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
                </label>
                <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-black placeholder:text-black"
                placeholder="usuario@educa360.com"
                disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
                </label>
                <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-black placeholder:text-black"
                placeholder="••••••••"
                disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Número de teléfono
                </label>
                <input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-black placeholder:text-black"
                placeholder="+34 600 000 000"
                disabled={loading}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Registrando..." : "Crear cuenta"}
            </button>
            </form>

            {error && (
            <div className="mt-4 p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200" role="alert">
                {error}
            </div>
            )}

            <div className="mt-6 text-center">
            <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-sm text-blue-600 hover:underline focus:outline-none"
            >
                ← Volver al inicio de sesión
            </button>
            </div>

        </div>
        </main>
    );
}
