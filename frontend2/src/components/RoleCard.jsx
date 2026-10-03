import { Button } from "@heroui/react";
import { Shield } from "@gravity-ui/icons";

// Turns { Sales: ["Read","Write"], Inventory: [] } into
// ["Sales: Read, Write"] -- modules with nothing checked are skipped so
// the card doesn't get cluttered with empty entries.
function summarizePermissions(permissions = {}) {
  return Object.entries(permissions)
    .filter(([, actions]) => Array.isArray(actions) && actions.length > 0)
    .map(([module, actions]) => `${module}: ${actions.join(", ")}`);
}

export default function RoleCard({ role, onEdit, onDelete }) {
  const summary = summarizePermissions(role.permissions);
  // Delete is only safe when the role isn't one of the 4 system roles AND
  // no user account currently uses it (the backend enforces both of these
  // too -- this is just so the button reflects it before you even click).
  const canDelete = !role.is_protected && (role.user_count ?? 0) === 0;

  return (
    <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col gap-3 h-full">
      <div className="flex gap-4 items-start">
        <div className="h-12 w-12 rounded-full bg-[#3f5fb2] text-white flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-lg truncate text-gray-900">
              {role.role_name}
            </p>
            {role.is_protected && (
              <span
                title="Used by the system (login, permissions) — name can't be changed"
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500"
              >
                System role
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
            {role.description || "No description provided."}
          </p>

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
      <div className="flex gap-2 justify-end mt-auto pt-2">
        <Button
          size="sm"
          className="bg-amber-500 text-white font-medium"
          onPress={() => onEdit(role)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="danger"
          className="font-medium"
          onPress={() => onDelete(role)}
          isDisabled={!canDelete}
          title={
            !canDelete
              ? role.is_protected
                ? "System roles can't be deleted"
                : "Reassign this role's users before deleting"
              : undefined
          }
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
