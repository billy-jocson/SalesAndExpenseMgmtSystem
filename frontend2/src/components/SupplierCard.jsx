import { Button, Card, Separator, Typography } from "@heroui/react";

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
  supplierId,
  supplierName,
  contactPerson,
  email,
  phone,
  address,
  onEdit,
  onDelete,
}) {
  return (
    <Card className="w-full hover:scale-101 hover:shadow-lg transition-all h-fit">
      <Card.Header className="gap-3">
        <div className="min-w-0">
          <Typography type="label-sm" color="muted">
            Supplier ID #{supplierId}
          </Typography>
        </div>
      </Card.Header>
      <Separator />

      <Card.Content className="flex flex-col gap-3">
        <Card.Title className="truncate text-base font-semibold text-gray-900">
          {supplierName}
        </Card.Title>

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
      </Card.Content>
      <Separator />

      <Card.Footer className="flex justify-end gap-1">
        <Button
          variant="primary"
          className="rounded-full bg-amber-500"
          onPress={onEdit}
        >
          Edit
        </Button>
        <Button variant="danger" className="rounded-full" onPress={onDelete}>
          Delete
        </Button>
      </Card.Footer>
    </Card>
  );
}
