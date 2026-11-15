'use client';

import { useState, useEffect } from 'react';
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where } from 'firebase/firestore';

interface ProfesionalPublico {
    id: string;
    nombre: string;
    especialidad: string;
    sedes: string[];
    presentacion: string;
    fotoUrl?: string;
    }

    export default function CuadroMedicoPublico() {
    const [profesionales, setProfesionales] = useState<ProfesionalPublico[]>([]);
    const [especialidadFiltro, setEspecialidadFiltro] = useState('');
    const [sedeFiltro, setSedeFiltro] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfesionales() {
        try {
            const querySnapshot = await getDocs(collection(db, 'profesionales_publicos'));
            const lista: ProfesionalPublico[] = [];
            querySnapshot.forEach((doc) => {
            lista.push({ id: doc.id, ...doc.data() } as ProfesionalPublico);
            });
            setProfesionales(lista);
        } catch (error) {
            console.error("Error al cargar profesionales públicos:", error);
        } finally {
            setLoading(false);
        }
        }
        fetchProfesionales();
    }, []);

    const profesionalesFiltrados = profesionales.filter((prof) => {
        const coincideEspecialidad = especialidadFiltro === '' || prof.especialidad.toLowerCase().includes(especialidadFiltro.toLowerCase());
        const coincideSede = sedeFiltro === '' || prof.sedes?.includes(sedeFiltro);
        return coincideEspecialidad && coincideSede;
    });

    if (loading) return <p className="p-6 text-center">Cargando cuadro médico...</p>;

    return (
        <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Cuadro Médico</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <input
            type="text"
            placeholder="Filtrar por especialidad (ej. Pediatría)..."
            value={especialidadFiltro}
            onChange={(e) => setEspecialidadFiltro(e.target.value)}
            className="border p-2 rounded-md"
            />
            <input
            type="text"
            placeholder="Filtrar por sede..."
            value={sedeFiltro}
            onChange={(e) => setSedeFiltro(e.target.value)}
            className="border p-2 rounded-md"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profesionalesFiltrados.map((prof) => (
            <div key={prof.id} className="border rounded-lg p-4 shadow-sm bg-white">
                <h2 className="text-xl font-semibold">{prof.nombre}</h2>
                <p className="text-blue-600 font-medium">{prof.especialidad}</p>
                <p className="text-gray-600 text-sm mt-2">{prof.presentacion}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                {prof.sedes?.map((sede, idx) => (
                    <span key={idx} className="bg-gray-100 text-xs px-2 py-1 rounded">
                    {sede}
                    </span>
                ))}
                </div>
            </div>
            ))}
        </div>
        </div>
    );
}