import { NumberField } from "@heroui/react";
import { useState } from "react";

export default function QtyButtons({ initialQuantity = 0, stock, onChange }) {
  const safeStock =
    stock === undefined ? Infinity : Math.max(Number(stock) || 0, 0);
  const [quantity, setQuantity] = useState(
    Math.min(Math.max(Number(initialQuantity) || 0, 0), safeStock),
  );
  const displayQuantity = Math.min(Math.max(quantity, 0), safeStock);

  const updateQuantity = (nextQuantity) => {
    const clampedQuantity = Math.min(Math.max(nextQuantity, 0), safeStock);

    setQuantity(clampedQuantity);
    onChange?.(clampedQuantity);
  };

  return (
    <NumberField
      aria-label="Quantity"
      className="w-fit"
      minValue={0}
      maxValue={safeStock === Infinity ? undefined : safeStock}
      value={displayQuantity}
      onChange={(nextValue) => updateQuantity(Number(nextValue) || 0)}
    >
      <NumberField.Group className="w-32">
        <NumberField.DecrementButton />
        <NumberField.Input className="min-w-0 text-center" />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  );
}
