import { Typography, Button } from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";
import QtyButtons from "./QtyButtons.jsx";

export default function POSBillItem({
  name,
  price,
  quantity,
  image,
  onQuantityChange,
  onRemove,
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-2 shadow-sm relative">
      <div className="flex items-center gap-3">
        <img
          src={image}
          alt={name}
          className="w-14 rounded-lg aspect-square object-cover bg-white"
        />

        <div className="flex-1">
          <div className="p-0">
            <Typography className="text-sm font-semibold">{name}</Typography>
            <Typography color="muted" className="text-sm font-medium">
              ₱{price.toFixed(2)}
            </Typography>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        {/* Explicit Remove Button added here */}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          className="min-w-0 w-8 h-8 rounded-full"
          onPress={onRemove}
          aria-label="Remove item"
        >
          <TrashBin className="w-4 h-4 text-red-500" />
        </Button>
        <QtyButtons value={quantity} onChange={onQuantityChange} />
      </div>
    </div>
  );
}
