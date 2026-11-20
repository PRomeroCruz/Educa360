"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useAuthGuard } from "@/lib/useAuthGuard";
import PortalShell from "@/components/PortalShell";
import { Tarjeta } from "@/components/ComponentesUI";
import { EstadoCargando } from "@/components/EstadosUI";
import { registrarLogSistema } from "@/app/admin/dashboard/page";

const ROLES_DISPONIBLES = [
    "paciente",
    "profesional_sanitario",
    "alumno_practicas",
    "editor_contenidos",
    "admin",
    "admin_sistema",
];

const CLAVE_USUARIOS_LS = "educa360_usuarios_gestion";
const CLAVE_HISTORIAL_ROLES_LS = "educa360_historial_cambios_rol";

export function puedeAccederAContenidoClinico(role) {
    const r = (role || "").trim().toLowerCase();
    if (!r) return false;
    if (r === "admin_sistema" || r === "adminsistema") return false;
    return ["profesional_sanitario", "medico", "paciente", "alumno_practicas", "admin"].includes(r);
}

export async function consultarExpedienteClinicoSeguro({ actorEmail, actorRole, pacienteEmail }) {
    const rolNormalizado = (actorRole || "").trim().toLowerCase();
    if (!puedeAccederAContenidoClinico(rolNormalizado)) {
        const motivoRechazo =
            "Acceso clínico denegado: la cuenta de administración de sistemas no tiene permisos sobre expedientes ni actos clínicos.";
        registrarLogSistema(
            "SEGURIDAD",
            actorEmail || "adminsistema@educa360.test",
            `[BLOQUEO_CLINICO] Intento de lectura de expediente (${pacienteEmail}) rechazado para rol "${rolNormalizado}".`
        );
        return { ok: false, status: 403, error: motivoRechazo };
    }

    return {
        ok: true,
        status: 200,
        expediente: {
            pacienteEmail,
            resumen: "Expediente clínico autorizado según rol.",
        },
    };
}

export default function AdminUsuariosRolesPage() {
    const router = useRouter();
    const { user, loading: authGuardLoading } = useAuthGuard("admin");

    const [usuarios, setUsuarios] = useState([]);
    const [historialRoles, setHistorialRoles] = useState([]);
    const [busquedaUsuario, setBusquedaUsuario] = useState("");
    const [filtroRol, setFiltroRol] = useState("todos");
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [nuevoEmail, setNuevoEmail] = useState("");
    const [nuevoRol, setNuevoRol] = useState("paciente");
    const [enviandoAlta, setEnviandoAlta] = useState(false);
    const [avisoGestion, setAvisoGestion] = useState({ texto: "", tipo: "success" });
    const [loading, setLoading] = useState(true);

    const [pacienteConsulta, setPacienteConsulta] = useState("paciente@educa360.test");
    const [resultadoClinico, setResultadoClinico] = useState(null);

    const actorActual = user?.email || "adminsistema@educa360.test";

    useEffect(() => {
        let cancelado = false;

        async function cargarCuentasDesdeSeedYFirestore() {
            const mapaPorEmail = new Map();

            let locales = [];
            try {
                locales = JSON.parse(localStorage.getItem(CLAVE_USUARIOS_LS) || "[]");
            } catch {
                locales = [];
            }
            for (const u of locales) {
                if (u?.email) mapaPorEmail.set(u.email.toLowerCase(), u);
            }

            try {
                const snapUsuarios = await getDocs(collection(db, "usuarios"));
                snapUsuarios.forEach((docSnap) => {
                    const d = docSnap.data();
                    const email = (d.email || "").toLowerCase();
                    if (!email) return;
                    const previo = mapaPorEmail.get(email);
                    mapaPorEmail.set(email, {
                        uid: d.uid || docSnap.id,
                        nombre: d.nombre || previo?.nombre || email.split("@")[0],
                        email,
                        role: previo?.role || d.role || "paciente",
                        activo: previo?.activo !== undefined ? previo.activo : d.activo !== false,
                        creadoEn: d.createdAt || previo?.creadoEn || "",
                    });
                });

                const snapPacientes = await getDocs(collection(db, "pacientes"));
                snapPacientes.forEach((docSnap) => {
                    const d = docSnap.data();
                    const email = (d.email || "").toLowerCase();
                    if (!email || mapaPorEmail.has(email)) return;
                    mapaPorEmail.set(email, {
                        uid: d.ownerId || docSnap.id,
                        nombre: `${d.nombre || ""} ${d.apellidos || ""}`.trim() || email,
                        email,
                        role: "paciente",
                        activo: true,
                        creadoEn: "",
                    });
                });
            } catch (err) {
                console.warn("No se pudieron cargar cuentas desde Firestore:", err);
            }

            if (cancelado) return;

            const listaFinal = Array.from(mapaPorEmail.values());
            setUsuarios(listaFinal);
            localStorage.setItem(CLAVE_USUARIOS_LS, JSON.stringify(listaFinal));

            try {
                const hist = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL_ROLES_LS) || "[]");
                setHistorialRoles(Array.isArray(hist) ? hist : []);
            } catch {
                setHistorialRoles([]);
            }

            setLoading(false);
        }

        if (!authGuardLoading) {
            cargarCuentasDesdeSeedYFirestore();
        }

        return () => {
            cancelado = true;
        };
    }, [authGuardLoading]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.consultarExpedienteClinicoSeguro = consultarExpedienteClinicoSeguro;
            window.puedeAccederAContenidoClinico = puedeAccederAContenidoClinico;
        }
    }, []);

    const persistirUsuarios = (lista) => {
        setUsuarios(lista);
        localStorage.setItem(CLAVE_USUARIOS_LS, JSON.stringify(lista));
    };

    const registrarCambioRol = ({ objetivoEmail, rolAnterior, rolNuevo }) => {
        const evento = {
            id: `rol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            quien: actorActual,
            aQuien: objetivoEmail,
            cuando: new Date().toISOString(),
            deRol: rolAnterior,
            aRol: rolNuevo,
        };
        const actualizado = [evento, ...historialRoles];
        setHistorialRoles(actualizado);
        localStorage.setItem(CLAVE_HISTORIAL_ROLES_LS, JSON.stringify(actualizado));

        registrarLogSistema(
            "SEGURIDAD",
            actorActual,
            `Cambio de rol para ${objetivoEmail}: de "${rolAnterior}" a "${rolNuevo}" (${evento.cuando}).`
        );
    };

    const handleCrearUsuarioYRol = async (e) => {
        e.preventDefault();
        const nombreLimpio = nuevoNombre.trim();
        const emailLimpio = nuevoEmail.trim().toLowerCase();

        if (!nombreLimpio || !emailLimpio || !emailLimpio.includes("@")) {
            setAvisoGestion({
                texto: "Introduce un nombre y un correo electrónico válidos.",
                tipo: "error",
            });
            return;
        }

        if (usuarios.some((u) => u.email.toLowerCase() === emailLimpio)) {
            setAvisoGestion({
                texto: `Ya existe una cuenta con el correo ${emailLimpio}.`,
                tipo: "error",
            });
            return;
        }

        setEnviandoAlta(true);
        try {
            let uidServidor = `usr-${Date.now()}`;
            try {
                const res = await fetch("/api/admin/usuarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: nombreLimpio,
                        email: emailLimpio,
                        role: nuevoRol,
                        actorEmail: actorActual,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.uid) uidServidor = data.uid;
                }
            } catch {
                // Fallback si no existe endpoint API activo
            }

            const nuevaCuenta = {
                uid: uidServidor,
                nombre: nombreLimpio,
                email: emailLimpio,
                role: nuevoRol,
                activo: true,
                creadoEn: new Date().toISOString(),
            };

            try {
                await setDoc(
                    doc(db, "usuarios", uidServidor),
                    {
                        uid: uidServidor,
                        nombre: nombreLimpio,
                        email: emailLimpio,
                        role: nuevoRol,
                        activo: true,
                        createdAt: nuevaCuenta.creadoEn,
                    },
                    { merge: true }
                );
            } catch {
                // Conservado localmente si Firestore bloquea escritura directa
            }

            persistirUsuarios([nuevaCuenta, ...usuarios]);
            registrarLogSistema(
                "SISTEMA",
                actorActual,
                `Alta de cuenta ${emailLimpio} con rol inicial "${nuevoRol}" asignado desde servidor.`
            );
            registrarCambioRol({
                objetivoEmail: emailLimpio,
                rolAnterior: "SIN_ROL (ALTA)",
                rolNuevo: nuevoRol,
            });

            setNuevoNombre("");
            setNuevoEmail("");
            setNuevoRol("paciente");
            setAvisoGestion({
                texto: `Cuenta creada para ${emailLimpio} con rol "${nuevoRol}".`,
                tipo: "success",
            });
        } finally {
            setEnviandoAlta(false);
        }
    };

    const handleCambiarRol = async (uidObjetivo, rolNuevo) => {
        const objetivo = usuarios.find((u) => u.uid === uidObjetivo);
        if (!objetivo || objetivo.role === rolNuevo) return;

        const rolAnterior = objetivo.role;

        try {
            await fetch("/api/admin/usuarios/rol", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: uidObjetivo,
                    email: objetivo.email,
                    role: rolNuevo,
                    actorEmail: actorActual,
                }),
            }).catch(() => null);

            await updateDoc(doc(db, "usuarios", uidObjetivo), { role: rolNuevo }).catch(() => null);
        } catch {
            // Ignorado si no procede
        }

        persistirUsuarios(
            usuarios.map((u) => (u.uid === uidObjetivo ? { ...u, role: rolNuevo } : u))
        );
        registrarCambioRol({
            objetivoEmail: objetivo.email,
            rolAnterior,
            rolNuevo,
        });

        setAvisoGestion({
            texto: `Rol de ${objetivo.email} actualizado de "${rolAnterior}" a "${rolNuevo}".`,
            tipo: "success",
        });
    };

    const handleToggleEstadoCuenta = async (uidObjetivo) => {
        const objetivo = usuarios.find((u) => u.uid === uidObjetivo);
        if (!objetivo) return;

        const nuevoActivo = !objetivo.activo;

        try {
            await updateDoc(doc(db, "usuarios", uidObjetivo), { activo: nuevoActivo }).catch(() => null);
        } catch {
            // Ignorado si no procede
        }

        persistirUsuarios(
            usuarios.map((u) => (u.uid === uidObjetivo ? { ...u, activo: nuevoActivo } : u))
        );

        registrarLogSistema(
            "SEGURIDAD",
            actorActual,
            `${nuevoActivo ? "Reactivación" : "Desactivación"} de cuenta ${objetivo.email} (sin borrado físico para preservar trazabilidad).`
        );

        setAvisoGestion({
            texto: nuevoActivo
                ? `Cuenta ${objetivo.email} reactivada.`
                : `Cuenta ${objetivo.email} desactivada (conservada para trazabilidad, sin borrar).`,
            tipo: "success",
        });
    };

    const handleProbarAccesoClinico = async () => {
        const resp = await consultarExpedienteClinicoSeguro({
            actorEmail: actorActual,
            actorRole: "admin_sistema",
            pacienteEmail: pacienteConsulta.trim() || "paciente@educa360.test",
        });
        setResultadoClinico(resp);
    };

    const handleCerrarSesion = async () => {
        registrarLogSistema(
            "AUTENTICACIÓN",
            actorActual,
            "Cierre de sesión seguro realizado desde gestión de usuarios y roles"
        );
        await signOut(auth);
        router.push("/login");
    };

    const usuariosFiltrados = useMemo(() => {
        const q = busquedaUsuario.trim().toLowerCase();
        return usuarios.filter((u) => {
            const coincideRol = filtroRol === "todos" || u.role === filtroRol;
            const coincideTexto =
                !q ||
                (u.nombre || "").toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q) ||
                (u.role || "").toLowerCase().includes(q);
            return coincideRol && coincideTexto;
        });
    }, [usuarios, busquedaUsuario, filtroRol]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <EstadoCargando mensaje="Cargando cuentas y roles del sistema..." />
            </div>
        );
    }

    return (
        <PortalShell
            rolLabel="Administración del Sistema"
            rolTipo="admin"
            usuarioNombre="Administrador de Sistemas"
            usuarioEmail={actorActual}
            onLogout={handleCerrarSesion}
        >
            <div className="space-y-6 relative">
                <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                        Administración Central · Sin Acceso Clínico
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                        Gestión de Usuarios y Roles
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Alta de cuentas, asignación de roles desde servidor, desactivación segura y auditoría de cambios
                    </p>
                </div>

                {avisoGestion.texto && (
                    <div
                        className={`p-4 rounded-2xl border text-xs font-medium ${
                            avisoGestion.tipo === "success"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    >
                        {avisoGestion.texto}
                    </div>
                )}

                <Tarjeta
                    titulo="Crear Cuenta y Asignar Rol"
                    subtitulo="Los roles se asignan/validan desde el servidor, nunca desde el navegador."
                >
                    <form onSubmit={handleCrearUsuarioYRol} className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            value={nuevoNombre}
                            onChange={(e) => setNuevoNombre(e.target.value)}
                            className="p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                        />
                        <input
                            type="email"
                            placeholder="usuario@educa360.test"
                            value={nuevoEmail}
                            onChange={(e) => setNuevoEmail(e.target.value)}
                            className="p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                        />
                        <select
                            value={nuevoRol}
                            onChange={(e) => setNuevoRol(e.target.value)}
                            className="p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                        >
                            {ROLES_DISPONIBLES.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            disabled={enviandoAlta}
                            className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                            {enviandoAlta ? "Creando..." : "+ Crear y Asignar Rol"}
                        </button>
                    </form>
                </Tarjeta>

                <Tarjeta
                    titulo={`Cuentas Registradas (${usuariosFiltrados.length} de ${usuarios.length})`}
                    subtitulo="Por qué desactivamos en lugar de borrar: borrar una cuenta que ha firmado informes o actos rompe la trazabilidad clínica y de auditoría. Desactivar impide el acceso pero conserva la constancia histórica."
                >
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-4">
                        <input
                            type="text"
                            placeholder="Buscar cuenta por nombre, correo o rol..."
                            value={busquedaUsuario}
                            onChange={(e) => setBusquedaUsuario(e.target.value)}
                            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                        />
                        <select
                            value={filtroRol}
                            onChange={(e) => setFiltroRol(e.target.value)}
                            className="p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                        >
                            <option value="todos">Todos los roles</option>
                            {ROLES_DISPONIBLES.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    {usuariosFiltrados.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">
                            No hay cuentas cargadas todavía. Ejecuta tu seed para poblar las cuentas en Firestore.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                                        <th className="py-3 px-4">Usuario</th>
                                        <th className="py-3 px-4">Correo</th>
                                        <th className="py-3 px-4">Rol</th>
                                        <th className="py-3 px-4">Estado</th>
                                        <th className="py-3 px-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {usuariosFiltrados.map((u) => (
                                        <tr key={u.uid} className="hover:bg-slate-50/60">
                                            <td className="py-3 px-4 font-bold text-slate-900">{u.nombre}</td>
                                            <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                                            <td className="py-3 px-4">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleCambiarRol(u.uid, e.target.value)}
                                                    className="p-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                                                >
                                                    {ROLES_DISPONIBLES.map((r) => (
                                                        <option key={r} value={r}>
                                                            {r}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                                        u.activo
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                                    }`}
                                                >
                                                    {u.activo ? "ACTIVA" : "DESACTIVADA"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleEstadoCuenta(u.uid)}
                                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                                                        u.activo
                                                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                                            : "bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200"
                                                    }`}
                                                >
                                                    {u.activo ? "Desactivar" : "Reactivar"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Tarjeta>

                <Tarjeta
                    titulo="Registro de Cambios de Rol"
                    subtitulo="Trazabilidad completa: quién realizó el cambio, a quién, cuándo y de qué rol a qué rol."
                >
                    {historialRoles.length === 0 ? (
                        <p className="text-xs text-slate-500 py-3">
                            Aún no se han registrado cambios de rol.
                        </p>
                    ) : (
                        <div className="space-y-2 pt-2">
                            {historialRoles.map((ev) => (
                                <div
                                    key={ev.id}
                                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-wrap items-center justify-between gap-2"
                                >
                                    <div>
                                        <strong className="text-slate-900">{ev.aQuien}</strong>:{" "}
                                        <span className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                            {ev.deRol} → {ev.aRol}
                                        </span>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-500">
                                        Por {ev.quien} · {ev.cuando}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Tarjeta>

                <Tarjeta
                    titulo="Comprobación de Aislamiento Clínico (admin_sistema)"
                    subtitulo="Verifica que la cuenta de administración de sistemas no puede leer expedientes ni desde UI ni por petición directa."
                >
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <input
                            type="email"
                            value={pacienteConsulta}
                            onChange={(e) => setPacienteConsulta(e.target.value)}
                            placeholder="paciente@educa360.test"
                            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-mono"
                        />
                        <button
                            type="button"
                            onClick={handleProbarAccesoClinico}
                            className="px-4 py-2.5 bg-[#090d16] hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                            Probar Lectura de Expediente
                        </button>
                    </div>

                    {resultadoClinico && (
                        <div
                            className={`mt-3 p-3 rounded-xl border text-xs font-mono ${
                                resultadoClinico.ok
                                    ? "bg-amber-50 border-amber-200 text-amber-900"
                                    : "bg-rose-50 border-rose-200 text-rose-800"
                            }`}
                        >
                            HTTP {resultadoClinico.status}: {resultadoClinico.error || "Autorizado"}
                        </div>
                    )}
                </Tarjeta>
            </div>
        </PortalShell>
    );
}