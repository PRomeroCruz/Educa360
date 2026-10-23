import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    connectFirestoreEmulator, 
    collection, 
    addDoc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    projectId: "educa360-dev"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

connectFirestoreEmulator(db, '127.0.0.1', 8080);

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('datoInput');
    const btnGuardar = document.getElementById('btnGuardar');
    const listaDatos = document.getElementById('listaDatos');

    const coleccionPruebas = collection(db, "pruebas_temp");

    // PASO 2: Guardar
    btnGuardar.addEventListener('click', async () => {
        const texto = input.value.trim();
        if (texto !== "") {
            try {
                await addDoc(coleccionPruebas, {
                mensaje: texto,
                creadoEn: new Date()
                });
                console.log("¡Dato enviado con éxito!");
                input.value = "";
            } catch (error) {
                console.error("Error al guardar:", error);
            }
        }
    });

    // PASO 3: Leer
    onSnapshot(coleccionPruebas, (snapshot) => {
        listaDatos.innerHTML = "";
        snapshot.forEach((doc) => {
            const li = document.createElement('li');
            li.textContent = doc.data().mensaje;
            listaDatos.appendChild(li);
        });
    });
});