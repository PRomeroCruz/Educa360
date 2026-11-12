"use client";

import { auth } from "@/lib/firebaseConfig";

function currentDestination() {
    if (typeof window === "undefined") return "/";
    return `${window.location.pathname}${window.location.search}`;
}

function redirectToLogin() {
    const redirect = encodeURIComponent(currentDestination());
    window.location.replace(`/login?motivo=sesion&redirect=${redirect}`);
}

function redirectToAccessDenied() {
    window.location.replace("/acceso-denegado");
}

export async function apiFetch(input, init = {}) {
    const headers = new Headers(init.headers || {});
    const currentUser = auth.currentUser;

    if (currentUser) {
        try {
            headers.set("Authorization", `Bearer ${await currentUser.getIdToken()}`);
        } catch (error) {
            console.error("No se pudo renovar el token de sesión:", error);
            redirectToLogin();
            throw new Error("SESSION_EXPIRED");
        }
    }

    const response = await fetch(input, { ...init, headers });

    if (response.status === 401) {
        redirectToLogin();
        throw new Error("SESSION_EXPIRED");
    }

    if (response.status === 403) {
        redirectToAccessDenied();
        throw new Error("ACCESS_DENIED");
    }

    return response;
}
