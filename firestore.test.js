const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const fs = require("fs");

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "educa360-dev",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("Pruebas de Reglas de Seguridad - educa360", () => {
  
  // --- PRUEBAS DE ACTOS CLÍNICOS (Imprescindibles) ---
  describe("Colección /actos_clinicos", () => {
    
    it("DEBE PERMITIR a un profesional crear un acto clínico", async () => {
      const db = testEnv.authenticatedContext("profesional_1", { rol: "profesional" }).firestore();
      await assertSucceeds(
        db.collection("actos_clinicos").add({
          professional_id: "profesional_1",
          paciente_id: "paciente_1",
          estado: "Borrador"
        })
      );
    });

    it("DEBE DENEGAR a un paciente crear un acto clínico", async () => {
      const db = testEnv.authenticatedContext("paciente_1", { rol: "paciente" }).firestore();
      await assertFails(
        db.collection("actos_clinicos").add({
          professional_id: "paciente_1",
          paciente_id: "paciente_1",
          estado: "Borrador"
        })
      );
    });

    it("DEBE PERMITIR acceso directo por ID a un profesional para leer un acto clínico", async () => {
      // Pre-poblar un documento directamente omitiendo la app
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc("actos_clinicos/acto_123").set({
          professional_id: "profesional_1",
          paciente_id: "paciente_1",
          estado: "Borrador"
        });
      });

      const dbProf = testEnv.authenticatedContext("profesional_2", { rol: "profesional" }).firestore();
      // Acceso directo al recurso por ID
      await assertSucceeds(dbProf.doc("actos_clinicos/acto_123").get());
    });

  });

  // --- PRUEBAS DE AUDITORÍA (Inmutabilidad y Privacidad) ---
  describe("Colección /auditoria", () => {

    it("DEBE PERMITIR al paciente leer su propio registro de auditoría", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc("auditoria/log_1").set({
          paciente_id: "paciente_1",
          usuario_id: "paciente_1",
          tipo_entidad: "ACTO_CLINICO"
        });
      });

      const dbPaciente = testEnv.authenticatedContext("paciente_1", { rol: "paciente" }).firestore();
      await assertSucceeds(dbPaciente.doc("auditoria/log_1").get());
    });

    it("DEBE DENEGAR al paciente leer el registro de auditoría de otro usuario", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc("auditoria/log_2").set({
          paciente_id: "paciente_ajeno",
          usuario_id: "paciente_ajeno",
          tipo_entidad: "ACTO_CLINICO"
        });
      });

      const dbPaciente = testEnv.authenticatedContext("paciente_1", { rol: "paciente" }).firestore();
      await assertFails(dbPaciente.doc("auditoria/log_2").get());
    });

    it("DEBE DENEGAR la modificación o borrado de auditoría (Inmutabilidad estricta)", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc("auditoria/log_1").set({
          paciente_id: "paciente_1",
          usuario_id: "paciente_1"
        });
      });

      const dbAdmin = testEnv.authenticatedContext("admin_1", { rol: "admin" }).firestore();
      
      // Intentar actualizar debe fallar
      await assertFails(dbAdmin.doc("auditoria/log_1").update({ tipo_entidad: "MODIFICADO" }));
      
      // Intentar borrar debe fallar
      await assertFails(dbAdmin.doc("auditoria/log_1").delete());
    });

  });

});