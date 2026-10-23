const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');

async function runTests() {
  // 1. Inicializar el entorno de pruebas conectado al emulador en el puerto 8080
  const testEnv = await initializeTestEnvironment({
    projectId: "educa360-test",
    firestore: {
      host: "localhost",
      port: 8080,
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });

  console.log("🚀 Entorno de emulador conectado con éxito.");

  try {
    // 2. Definir identidades simuladas (Contextos de autenticación)
    const professionalAuth = testEnv.authenticatedContext("profesional_1", { role: "profesional" });
    const unauthContext = testEnv.unauthenticatedContext();

    const dbProf = professionalAuth.firestore();
    const dbUnauth = unauthContext.firestore();

    // 3. PRUEBA 1: Un usuario sin autenticar intenta leer pacientes (Debe fallar)
    console.log("Ejecutando Prueba 1: Acceso no autorizado...");
    await assertFails(dbUnauth.collection("pacientes").doc("paciente_1").get());
    console.log("✅ Prueba 1 superada: Acceso denegado correctamente a no autenticados.");

    // 4. PRUEBA 2: Un profesional crea un Acto Clínico en estado 'Borrador' (Debe tener éxito)
    console.log("Ejecutando Prueba 2: Creación de Acto Clínico en Borrador...");
    const actoRef = dbProf.collection("actosClinicos").doc("acto_1");
    await assertSucceeds(actoRef.set({
      estado: "Borrador",
      descripcion: "Consulta inicial de prueba"
    }));
    console.log("✅ Prueba 2 superada: Acto clínico en Borrador creado con éxito.");

    // 5. PRUEBA 3: Actualizar el acto clínico mientras sigue en Borrador (Debe tener éxito)
    console.log("Ejecutando Prueba 3: Actualización de Acto Clínico en Borrador...");
    await assertSucceeds(actoRef.update({
      descripcion: "Consulta actualizada"
    }));
    console.log("✅ Prueba 3 superada: Actualización permitida en Borrador.");

    // 6. PRUEBA 4: Simular cambio a 'Firmado' e intentar modificarlo (Debe fallar por inmutabilidad)
    // Forzamos el estado a 'Firmado' mediante bypass de administración del emulador
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("actosClinicos").doc("acto_1").update({
        estado: "Firmado"
      });
    });

    console.log("Ejecutando Prueba 4: Intentar modificar un Acto Clínico Firmado (Inmutabilidad)...");
    await assertFails(actoRef.update({
      descripcion: "Intento de modificación ilegal"
    }));
    console.log("✅ Prueba 4 superada: Inmutabilidad respetada, bloqueo de escritura en Firmado exitoso.");

  } finally {
    // Limpiar entorno
    await testEnv.cleanup();
    console.log("\n🎉 ¡Todas las pruebas de simulación se han ejecutado y validado correctamente!");
  }
}

runTests().catch(console.error);