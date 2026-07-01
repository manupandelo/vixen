import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

import {
  StaffCreateDialog,
} from "@/components/admin/AdminStaffForms";
import {
  AdminMetric,
  AdminMobileField,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusPill,
  AdminTableHeader,
  adminSecondaryActionClass,
} from "@/components/admin/AdminUI";
import { createStaffUser } from "@/features/football-tournaments/staff-actions";
import { getAdminStaffProfiles, getCurrentAdmin } from "@/features/football-tournaments/data";
import type {
  StaffRole,
  StaffStatus,
} from "@/features/football-tournaments/types";

export const metadata: Metadata = {
  title: "Usuarios — Vixen Admin",
  description: "Gestión interna de administradores y veedores.",
};

const roleLabels: Record<StaffRole, string> = {
  admin: "Administrador",
  viewer: "Veedor",
};

const roleDescriptions: Record<StaffRole, string> = {
  admin: "Puede crear torneos, editar datos, cargar resultados y corregir errores.",
  viewer: "Puede cargar resultados finales de los partidos asignados una sola vez.",
};

const statusLabels: Record<StaffStatus, string> = {
  active: "Activo",
  suspended: "Suspendido",
};

export default async function AdminUsersPage() {
  const [staffProfiles, currentAdmin] = await Promise.all([
    getAdminStaffProfiles(),
    getCurrentAdmin(),
  ]);
  const adminCount = staffProfiles.filter(
    (profile) => profile.role === "admin",
  ).length;
  const viewerCount = staffProfiles.filter(
    (profile) => profile.role === "viewer",
  ).length;
  const activeCount = staffProfiles.filter(
    (profile) => profile.status === "active",
  ).length;
  const suspendedCount = staffProfiles.filter(
    (profile) => profile.status === "suspended",
  ).length;

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Accesos"
        title="Usuarios"
        description="Revisá qué personas tienen acceso al panel. Los administradores gestionan todo; los veedores solo cargan resultados asignados."
        renderMeta={() => (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-semibold text-white/58">
            <UserCheck size={14} aria-hidden="true" />
            {staffProfiles.length} perfiles
          </span>
        )}
        renderActions={() => <StaffCreateDialog action={createStaffUser} />}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetric label="Admins" value={adminCount} />
        <AdminMetric label="Veedores" value={viewerCount} />
        <AdminMetric label="Activos" value={activeCount} />
        <AdminMetric label="Suspendidos" value={suspendedCount} />
      </section>

      <AdminPanel>
        <AdminTableHeader className="grid-cols-[1fr_0.5fr_0.45fr_0.45fr]">
          <span>Usuario</span>
          <span>Rol</span>
          <span>Estado</span>
          <span>Detalle</span>
        </AdminTableHeader>

        {staffProfiles.length > 0 ? (
          <div className="divide-y divide-white/10">
            {staffProfiles.map((profile) => {
              const isSelf = profile.id === currentAdmin?.id;
              const isSuspended = profile.status === "suspended";

              return (
                <article
                  key={profile.id}
                  className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_0.5fr_0.45fr_0.45fr] lg:items-center"
                >
                  <AdminMobileField label="Usuario">
                    <h2 className="text-base font-semibold text-white">
                      {profile.email}
                    </h2>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/42">
                      {isSelf ? "Tu cuenta" : profile.id}
                    </p>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)] lg:hidden">
                      {roleDescriptions[profile.role]}
                    </p>
                  </AdminMobileField>

                  <AdminMobileField label="Rol">
                    <div className="grid gap-2">
                      <AdminStatusPill tone={isSuspended ? "muted" : "accent"}>
                        {profile.role === "admin" ? (
                          <ShieldCheck size={14} aria-hidden="true" />
                        ) : null}
                        {roleLabels[profile.role]}
                      </AdminStatusPill>
                    </div>
                  </AdminMobileField>

                  <AdminMobileField label="Estado">
                    <div className="grid gap-2">
                      <AdminStatusPill
                        tone={isSuspended ? "danger" : "accent"}
                      >
                        {statusLabels[profile.status]}
                      </AdminStatusPill>
                      {profile.suspended_reason ? (
                        <p className="text-xs leading-5 text-white/48">
                          {profile.suspended_reason}
                        </p>
                      ) : null}
                    </div>
                  </AdminMobileField>

                  <AdminMobileField label="Detalle">
                    <Link
                      href={`/admin/usuarios/${profile.id}`}
                      aria-label={`Ver detalle de ${profile.email}`}
                      className={adminSecondaryActionClass}
                    >
                      Ver detalle
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </AdminMobileField>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white">
              No hay usuarios cargados.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Creá el primer usuario desde el botón superior cuando tu cuenta
              administradora inicial ya esté configurada.
            </p>
          </div>
        )}
      </AdminPanel>
    </AdminPage>
  );
}
