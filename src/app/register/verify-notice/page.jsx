"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { sendEmailVerification } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { dashboardParaRol } from "@/lib/roles";

function VerifyNoticeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get("email") || "";
    const roleParam = searchParams.get("role") || "";
    const { user } = useAuthGuard();

    const [verificado, setVerificado] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const comprobarVerificacion = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                router.push("/login");
                return;
            }

            try {
                await currentUser.reload();
            } catch (reloadErr) {
                console.warn("No se pudo recargar el token:", reloadErr);
            }

            const refreshedUser = auth.currentUser || currentUser;

            if (refreshedUser.emailVerified) {
                setVerificado(true);
                setMensaje("¡Correo verificado con éxito! Redirigiendo a tu panel...");

                let rolFinal = roleParam || localStorage.getItem(`rol_${refreshedUser.email}`);

                if (!rolFinal) {
                    try {
                        const userDocRef = doc(db, "usuarios", refreshedUser.uid);
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists()) {
                            rolFinal = userDoc.data().role;
                        }
                    } catch (e) {
                        console.error("Error leyendo Firestore:", e);
                    }
                }

                rolFinal = rolFinal || "paciente";
                localStorage.setItem(`rol_${refreshedUser.email}`, rolFinal);

                setTimeout(() => {
                    if (rolFinal === "profesional_sanitario") {
                        const totpConfigurado = localStorage.getItem(`totp_configurado_${refreshedUser.email}`);
                        if (!totpConfigurado) {
                            router.push(`/verify-2fa?email=${encodeURIComponent(refreshedUser.email)}`);
                            return;
                        }
                        router.push(dashboardParaRol(rolFinal));
                    } else {
                        router.push(dashboardParaRol(rolFinal));
                    }
                }, 1500);

            } else {
                setMensaje("El correo aún no ha sido verificado. Por favor, haz clic en el enlace que le hemos enviado.");
            }
        } catch (error) {
            console.error("Error al comprobar verificación:", error);
            router.push("/login");
        }
    };

    const reenviarCorreo = async () => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                await sendEmailVerification(currentUser);
                setMensaje("Correo de verificación reenviado con éxito. Revise su bandeja de entrada.");
            } else {
                router.push("/login");
            }
        } catch {
            setMensaje("Error al reenviar el correo. Por favor, inicie sesión de nuevo.");
            setTimeout(() => router.push("/login"), 2000);
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

            <div className="bg-[#f8fafc] rounded-[28px] shadow-2xl max-w-[440px] w-full p-8 sm:p-10 relative z-10 space-y-6 text-center">
                
                <div className="w-14 h-14 bg-teal-50 text-[#009688] rounded-2xl mx-auto flex items-center justify-center border border-teal-100 shadow-xs">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        Verifica tu correo electrónico
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed px-2">
                        Hemos enviado un enlace de verificación a <strong className="text-slate-700">{emailParam || user?.email}</strong>. Por favor, haz clic en él para continuar.
                    </p>
                </div>

                {mensaje && (
                    <div className={`p-3.5 text-xs rounded-xl font-medium ${verificado ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {mensaje}
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    <button
                        onClick={comprobarVerificacion}
                        className="w-full py-3.5 bg-[#009688] hover:bg-[#00796b] text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-700/25 transition cursor-pointer"
                    >
                        Ya he verificado mi correo
                    </button>

                    <button
                        onClick={reenviarCorreo}
                        className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200/80 cursor-pointer"
                    >
                        Reenviar correo de verificación
                    </button>
                </div>
            </div>

            <p className="text-[10px] font-mono text-slate-500 mt-8 text-center relative z-10">
                Entorno protegido con cifrado TLS 1.3 · Control de acceso institucional
            </p>

        </main>
    );
}

export default function VerifyNoticePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#090d16] flex items-center justify-center text-xs text-slate-400">Cargando verificación...</div>}>
            <VerifyNoticeContent />
        </Suspense>
    );
}