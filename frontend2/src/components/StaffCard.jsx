import {
  Envelope,
  Pencil,
  PersonFill,
  Smartphone,
  TrashBin,
} from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { formatDateTime } from "../utils/dateTime";

export default function StaffCard({
  staff,
  onDelete,
  onEdit,
  canEdit = true,
  canDelete = true,
}) {
  const initials =
    `${staff.first_name?.charAt(0) ?? ""}${staff.last_name?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <div className="h-full p-4 rounded-2xl hover:border-blue-400 border border-zinc-300 bg-white shadow-sm transition-all flex flex-col gap-1">
      <div className="flex gap-4 items-start mb-3">
        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold text-[0.95rem] truncate">
                {staff.first_name} {staff.middle_name} {staff.last_name}
              </p>
              <p className="text-xs text-zinc-500">
                @{staff.username} • {staff.role_name}
              </p>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-500 rounded-lg"
                    onPress={() => onEdit(staff)}
                  >
                    <Pencil />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 rounded-lg"
                    onPress={() => onDelete(staff)}
                  >
                    <TrashBin />
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-600">
            {staff.email && (
              <span className="flex gap-1">
                <Envelope /> {staff.email}
              </span>
            )}
            {staff.phone && (
              <span className="flex gap-1">
                <Smartphone /> {staff.phone}
              </span>
            )}
            {staff.hire_date && (
              <span className="flex gap-1">
                <PersonFill /> Hired: {formatDateTime(staff.hire_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
