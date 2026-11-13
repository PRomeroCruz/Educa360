"use client";

import { useState } from "react";
import PortalShell from "@/components/PortalShell";
import { Boton, Campo, Tarjeta, Aviso, Tabla } from "@/components/ComponentesUI";
import { EstadoCargando, EstadoVacio, EstadoError, EstadoSinConexion } from "@/components/EstadosUI";

export default function CatalogoComponentsPage() {
    const [busqueda, setBusqueda] = useState("");
    const [estadoSimulado, setEstadoSimulado] = useState("todos");

    return (
        <PortalShell
        rolLabel="Design System & UI Guidelines"
        usuarioNombre="Dra. Laura Martínez"
        usuarioEmail="equipo.clinico@educa360.test"
        >
        <div className="max-w-5xl mx-auto space-y-10 pb-16">
            <div className="border-b border-slate-200/80 pb-6 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                Educa360 · Core UI Architecture
                </span>
                <span className="text-xs font-mono text-slate-400">EQ-04 · Versión 2.4 Pro</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Sistema de Diseño Clínico Unificado
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Biblioteca de componentes estandarizados para el desarrollo paralelo de las interfaces del Portal de Citas. Diseñado bajo normativas de accesibilidad y rigor visual ejecutivo.
            </p>
            </div>

            <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">01. Tipografía y Paleta Institucional</h2>
                <span className="text-[11px] font-mono text-slate-400">Contraste AA+ Validado</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <p className="text-2xl font-bold text-slate-900 tracking-tight">Jerarquía Primaria (24px)</p>
                <p className="text-base font-bold text-slate-800">Subtítulo de Módulo (16px)</p>
                <p className="text-xs text-slate-600 leading-normal">Cuerpo de texto clínico para historiales y descripciones (12px Regular).</p>
                <p className="text-[11px] font-mono text-slate-400">Metadatos / Timestamps / IDs (11px Monospace)</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-semibold text-center">
                <div className="p-4 rounded-xl bg-teal-700 text-white flex flex-col justify-between">
                    <span>Principal</span>
                    <span className="font-mono text-[10px] opacity-80">Teal 700</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col justify-between">
                    <span>Estructura</span>
                    <span className="font-mono text-[10px] opacity-80">Slate 900</span>
                </div>
                <div className="p-4 rounded-xl bg-teal-50 text-teal-900 border border-teal-200 flex flex-col justify-between">
                    <span>Superficie Activa</span>
                    <span className="font-mono text-[10px] opacity-80">Teal 50</span>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 flex flex-col justify-between">
                    <span>Crítico / Alerta</span>
                    <span className="font-mono text-[10px] opacity-80">Rose 50</span>
                </div>
                </div>
            </div>
            </section>

            <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">02. Componentes Primitivos</h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Botones de Acción</label>
                    <div className="space-y-2">
                    <Boton variante="primary" className="w-full">Confirmar Cita Médica</Boton>
                    <Boton variante="secondary" className="w-full">Modificar Parámetros</Boton>
                    </div>
                </div>

                <div className="space-y-3">
                    <Campo
                    id="demo-input"
                    label="Campo de Entrada"
                    placeholder="Introduzca código de paciente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Aviso del Sistema</label>
                    <Aviso tipo="info" titulo="Protocolo de Privacidad">
                    Cifrado de extremo a extremo conforme a normativas sanitarias vigentes.
                    </Aviso>
                </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-3">Tabla de Datos Estándar</p>
                <Tabla
                    columnas={["Identificador", "Especialidad", "Facultativo Asignado", "Estado del Turno"]}
                    datos={[
                    ["EXP-8902", "Medicina General", "Dra. Laura Martínez", <span key="1" className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">Confirmada</span>],
                    ["EXP-8903", "Cardiología", "Dr. Alejandro Gómez", <span key="2" className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">En Espera</span>],
                    ]}
                />
                </div>
            </div>
            </section>

            <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">03. Estados del Sistema (Control de Flujo)</h2>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                {["todos", "cargando", "vacio", "error", "sin_conexion"].map((st) => (
                    <button
                    key={st}
                    onClick={() => setEstadoSimulado(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition capitalize ${
                        estadoSimulado === st ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                    >
                    {st.replace("_", " ")}
                    </button>
                ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(estadoSimulado === "todos" || estadoSimulado === "cargando") && <EstadoCargando />}
                {(estadoSimulado === "todos" || estadoSimulado === "vacio") && <EstadoVacio />}
                {(estadoSimulado === "todos" || estadoSimulado === "error") && <EstadoError />}
                {(estadoSimulado === "todos" || estadoSimulado === "sin_conexion") && <EstadoSinConexion />}
            </div>
            </section>
        </div>
        </PortalShell>
    );
}