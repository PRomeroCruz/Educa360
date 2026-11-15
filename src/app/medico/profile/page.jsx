'use client';

import { useState, useEffect } from 'react';
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from 'firebase/firestore';

export default function PerfilInternoProfesional() {
    const [perfilInterno, setPerfilInterno] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPerfilInterno() {
            try {
                const querySnapshot = await getDocs(collection(db, 'profesionales_internos'));
                
                if (!querySnapshot.empty) {
                    setPerfilInterno(querySnapshot.docs[0].data());
                } else {
                    console.log("La colección profesionales_internos está vacía");
                }
            } catch (error) {
                console.error("Error al cargar perfil interno:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPerfilInterno();
    }, []);

    if (loading) return <p className="p-6 text-center">Cargando datos internos...</p>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Panel de Gestión Interna - Profesional</h1>
            
            {perfilInterno ? (
                <div className="space-y-4">
                    <div className="border-b pb-4">
                        <p className="text-sm text-gray-500">Colegiado ID:</p>
                        <p className="text-lg font-semibold">{perfilInterno.numeroColegiado || 'No especificado'}</p>
                    </div>

                    <div className="border-b pb-4">
                        <p className="text-sm text-gray-500">Teléfono Privado:</p>
                        <p className="text-md">{perfilInterno.telefonoPrivado || 'No disponible'}</p>
                    </div>

                    <div className="border-b pb-4">
                        <p className="text-sm text-gray-500">Notas Administrativas / Horario Interno:</p>
                        <p className="text-md bg-gray-50 p-3 rounded">{perfilInterno.notasAdministrativas || 'Sin notas registradas.'}</p>
                    </div>
                </div>
            ) : (
                <p className="text-red-500">No se encuentra tu ficha interna en la base de datos.</p>
            )}
        </div>
    );
}