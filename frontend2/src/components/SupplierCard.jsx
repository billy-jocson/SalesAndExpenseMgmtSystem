import { Pencil, TrashBin } from "@gravity-ui/icons";
import { Button, Card, Separator } from "@heroui/react";

function SupplierDetail({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 wrap-break-word text-sm text-gray-900">{value}</p>
    </div>
  );
}

export default function SupplierCard({
  supplierName,
  contactPerson,
  email,
  phone,
  address,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) {
  const initials = supplierName.split(" ", 2);
  return (
    <Card className="w-full hover:border-blue-400 transition-all h-fit border border-zinc-300">
      <Card.Content>
        <div className="flex gap-3 w-full">
          <div className="w-fit">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center font-bold text-sm shrink-0">
              {initials[0].charAt(0)}
              {initials[1].charAt(0)}
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <div className="flex justify-between items-center">
              <div className="truncate text-base font-semibold text-gray-900">
                {supplierName}
              </div>
              {(canEdit || canDelete) && (
                <div className="flex items-center h-fit">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-amber-500"
                      onPress={onEdit}
                    >
                      <Pencil />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-red-500"
                      onPress={onDelete}
                    >
                      <TrashBin />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <Separator />

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <SupplierDetail label="Contact person" value={contactPerson} />
              <SupplierDetail label="Phone" value={phone} />
              <SupplierDetail label="Email" value={email} />
              <SupplierDetail
                label="Address"
                value={address}
                className="col-span-2"
              />
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
