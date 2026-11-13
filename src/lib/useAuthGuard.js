"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function useAuthGuard(allowedRolesString = "") {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                const rutaActual = window.location.pathname;
                router.push(`/login?sesionCaducada=true&redirect=${encodeURIComponent(rutaActual)}`);
                return;
            }

            setUser(currentUser);

            try {
                const userDocRef = doc(db, "usuarios", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                
                let userRole = "paciente";
                if (userDoc.exists()) {
                    userRole = userDoc.data().role || "paciente";
                } else {
                    userRole = localStorage.getItem(`rol_${currentUser.email}`) || "paciente";
                }

                setRole(userRole);

                const roleLower = userRole.toLowerCase();
                const emailLower = currentUser.email.toLowerCase();

                const isAdminGlobal = 
                    roleLower.includes("admin") || 
                    roleLower.includes("administraci") || 
                    emailLower.includes("administracion") || 
                    emailLower.includes("adminsistema");

                if (isAdminGlobal) {
                    setLoading(false);
                    return;
                }

                if (allowedRolesString) {
                    const allowedRoles = allowedRolesString.split(",").map(r => r.trim());

                    const isAuthorized = allowedRoles.some(allowed => {
                        const target = allowed.toLowerCase();
                        return roleLower.includes(target) || emailLower.includes(target);
                    });

                    if (!isAuthorized) {
                        router.push("/access-denied");
                        return;
                    }
                }
            } catch (error) {
                console.error("Error al validar el rol en el guard:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router, allowedRolesString]);

    return { user, loading, role };
}