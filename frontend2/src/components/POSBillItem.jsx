import { Typography } from "@heroui/react";
import QtyButtons from "./QtyButtons.jsx";

export default function POSBillItem({
  name,
  price,
  quantity,
  image,
  onQuantityChange,
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-2 shadow-sm">
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
              ${price.toFixed(2)}
            </Typography>
          </div>
        </div>
      </div>

      <QtyButtons initialQuantity={quantity} onChange={onQuantityChange} />
    </div>
  );
}
