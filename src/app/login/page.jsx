"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signOut
} from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const GENERIC_AUTH_ERROR = "Credenciales inválidas. Comprueba tu correo y contraseña.";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        await signOut(auth);
        setFeedback({
          type: "error",
          message: "Tu cuenta aún no está verificada. Te hemos reenviado un correo de verificación. Revisa tu bandeja de entrada."
        });
      } else {
        setFeedback({
          type: "success",
          message: "¡Acceso concedido! Redirigiendo..."
        });

        try {
          await fetch("/api/auditoria/send-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
        } catch (mailError) {
          console.error("No se pudo enviar el correo de notificación:", mailError);
        }

        router.push("/paciente/dashboard");
      }
    } catch (error) {
      console.error("Error de Auth:", error.code);
      setFeedback({
        type: "error",
        message: GENERIC_AUTH_ERROR
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Entrada - educa360
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-black placeholder:text-black"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Procesando..." : "Entrar"}
          </button>
        </form>

        {feedback.message && (
          <div 
            className={`mt-4 p-3 rounded-md text-sm ${
              feedback.type === "error" 
                ? "bg-red-50 text-red-700 border border-red-200" 
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
            role="alert"
          >
            {feedback.message}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-blue-600 hover:underline focus:outline-none"
          >
            ¿Has olvidado tu contraseña?
          </button>

          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-blue-600 font-semibold hover:underline focus:outline-none"
          >
            Regístrate
          </button>
        </div>

      </div>
    </main>
  );
}
