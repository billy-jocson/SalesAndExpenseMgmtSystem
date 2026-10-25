import { Button } from "@heroui/react";
import { Pencil, Shield, TrashBin } from "@gravity-ui/icons";

function summarizePermissions(permissions = []) {
  return permissions.map((permission) => {
    const name = permission.permission_name
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    return `${permission.module || "Other"}: ${name}`;
  });
}

export default function RoleCard({
  role,
  currentUserRole,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete: canDeletePermission = true,
}) {
  const summary = summarizePermissions(role.permissions);
  const isCurrentUserRole =
    role.role_name?.trim().toLowerCase() ===
    currentUserRole?.trim().toLowerCase();
  const hasAssignedUsers = Number(role.user_count ?? 0) > 0;
  const canDeleteRole =
    canDeletePermission && !isCurrentUserRole && !hasAssignedUsers;

  return (
    <div className="p-5 rounded-2xl border border-zinc-300 bg-white shadow-sm hover:border-blue-400 transition-all flex flex-col gap-3 h-full">
      <div className="flex gap-4 items-start">
        <div className="flex flex-col min-w-0">
          <div className="flex justify-between">
            <div className="me-auto h-12 w-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="ms-4">
              <p className="font-semibold text-lg truncate text-gray-900">
                {role.role_name}
              </p>
              <p className="text-xs text-zinc-500 line-clamp-2">
                {role.description || "No description provided."}
              </p>
            </div>

            {(canEdit || canDeletePermission) && (
              <div className="flex gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-500 rounded-lg"
                    onPress={() => onEdit(role)}
                  >
                    <Pencil />
                  </Button>
                )}
                {canDeletePermission && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 rounded-lg"
                    onPress={() => onDelete(role)}
                    isDisabled={!canDeleteRole}
                    title={
                      !canDeleteRole
                        ? isCurrentUserRole
                          ? "You cannot delete the role assigned to your account"
                          : "Reassign this role's users before deleting"
                        : undefined
                    }
                  >
                    <TrashBin />
                  </Button>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            {role.user_count ?? 0} {role.user_count === 1 ? "user" : "users"}{" "}
            assigned
          </p>

          {summary.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {summary.map((line) => (
                <span
                  key={line}
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                >
                  {line}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
