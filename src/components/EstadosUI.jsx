"use client";

export function EstadoCargando({ mensaje = "Sincronizando registros clínicos..." }) {
    return (
        <div role="status" className="bg-white rounded-2xl border border-slate-200/80 p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-800">{mensaje}</p>
        <p className="text-[11px] text-slate-400 font-mono">Conectando con base de datos segura...</p>
        </div>
    );
}

export function EstadoVacio({
    titulo = "No hay registros disponibles",
    descripcion = "No se han encontrado elementos asociados a los filtros de búsqueda actuales.",
    accionTexto,
    onAccion,
    }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
        <div className="space-y-1 max-w-sm">
            <p className="text-sm font-bold text-slate-900">{titulo}</p>
            <p className="text-xs text-slate-500">{descripcion}</p>
        </div>
        {accionTexto && onAccion && (
            <button
            onClick={onAccion}
            className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition shadow-2xs"
            >
            {accionTexto}
            </button>
        )}
        </div>
    );
}

export function EstadoError({
    titulo = "Error de sincronización con el servidor",
    descripcion = "No se ha podido completar la operación solicitada. Verifique su nivel de acceso.",
    onReintentar,
    }) {
    return (
        <div role="alert" className="bg-white rounded-2xl border border-rose-200 p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
        <div className="space-y-1 max-w-sm">
            <p className="text-sm font-bold text-slate-900">{titulo}</p>
            <p className="text-xs text-slate-600">{descripcion}</p>
        </div>
        {onReintentar && (
            <button
            onClick={onReintentar}
            className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl transition"
            >
            Reintentar operación
            </button>
        )}
        </div>
    );
}

export function EstadoSinConexion({ onReintentar }) {
    return (
        <div role="alert" className="bg-white rounded-2xl border border-amber-200 p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs">
        <div className="space-y-1 max-w-sm">
            <p className="text-sm font-bold text-slate-900">Operación en Modo Desconectado</p>
            <p className="text-xs text-slate-600">
            La red local no responde. Las transacciones se almacenarán en búfer local de forma segura.
            </p>
        </div>
        {onReintentar && (
            <button
            onClick={onReintentar}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition"
            >
            Verificar enlace de red
            </button>
        )}
        </div>
    );
}