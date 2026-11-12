export async function register() {
    if (process.env.NODE_ENV !== "development" || process.env.NEXT_RUNTIME !== "nodejs") return;

    const { seedCompleto, waitForAuthEmulator } = await import("./lib/seed-usuarios.js");

    waitForAuthEmulator()
        .then((available) => {
            if (!available) {
                console.warn("[seed] No se detectó el emulador de Auth en localhost:9099.");
                return;
            }

            return seedCompleto();
        })
        .catch((error) => {
            console.warn("[seed] No se pudo completar la carga de prueba:", error?.message || error);
        });
}
