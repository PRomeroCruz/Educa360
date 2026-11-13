"use client";

export function Boton({ children, variante = "primary", className = "", ...props }) {
    const estilos = {
        primary: "bg-slate-900 hover:bg-slate-800 text-white shadow-2xs",
        secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs",
        danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs",
    };

    return (
        <button
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 ${
            estilos[variante] || estilos.primary
        } ${className}`}
        {...props}
        >
        {children}
        </button>
    );
}

export function Campo({ label, id, error, ...props }) {
    return (
        <div className="space-y-1.5 text-left">
        {label && (
            <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {label}
            </label>
        )}
        <input
            id={id}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden transition ${
            error ? "border-rose-400" : "border-slate-200/80 shadow-2xs"
            }`}
            {...props}
        />
        {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
        </div>
    );
}

export function Tarjeta({ titulo, subtitulo, badge, accion, children, className = "" }) {
    return (
        <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4 ${className}`}>
        {(titulo || badge || accion) && (
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
                {badge && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-1.5">
                    {badge}
                </span>
                )}
                {titulo && <h3 className="text-sm font-bold text-slate-900 tracking-tight">{titulo}</h3>}
                {subtitulo && <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>}
            </div>
            {accion && <div>{accion}</div>}
            </div>
        )}
        <div>{children}</div>
        </section>
    );
}

export function Aviso({ tipo = "info", titulo, children }) {
    const estilos = {
        info: "bg-slate-50 border-slate-200 text-slate-900",
        warning: "bg-amber-50/50 border-amber-200 text-amber-950",
        error: "bg-rose-50/50 border-rose-200 text-rose-950",
    };

    return (
        <div role="status" className={`p-4 rounded-xl border text-xs space-y-1 ${estilos[tipo] || estilos.info}`}>
        {titulo && <p className="font-bold">{titulo}</p>}
        <div className="opacity-90 leading-relaxed">{children}</div>
        </div>
    );
}

export function Tabla({ columnas = [], datos = [] }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full text-left border-collapse text-xs">
            <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {columnas.map((col, idx) => (
                <th key={idx} className="py-3 px-4">
                    {col}
                </th>
                ))}
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
            {datos.map((fila, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 transition">
                {fila.map((celda, cIdx) => (
                    <td key={cIdx} className="py-3 px-4 text-slate-700">
                    {celda}
                    </td>
                ))}
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    );
}