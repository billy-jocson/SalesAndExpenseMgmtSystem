import { Card, Button, Input } from "@heroui/react";
import { useState } from "react";

// Add image prop to the function
export default function POSProductCard({ name, price, stock }) {
  const [quantity, setQuantity] = useState(0);
  const safeStock = Number(stock) || 0;
  const displayQuantity = Math.min(Math.max(quantity, 0), safeStock);

  const handleQuantityChange = (event) => {
    const nextValue = Number(event.target.value);

    if (Number.isNaN(nextValue)) {
      setQuantity(0);
      return;
    }

    const clampedValue = Math.min(Math.max(nextValue, 0), safeStock);
    setQuantity(clampedValue);
  };

  return (
    <Card className="w-auto grow gap-2 max-w-fit shadow-md">
      <img
        alt="Indie Hackers community"
        className="pointer-events-none aspect-square w-full rounded-2xl object-cover select-none"
        loading="lazy"
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Card.Header className="p-0">
            <Card.Title className="text-sm font-semibold">{name}</Card.Title>
            <Card.Description className="text-sm font-medium">
              ${price}
            </Card.Description>
          </Card.Header>
        </div>

        <div className="flex min-w-[118px] flex-col items-end gap-1">
          <span className="text-[11px] font-medium text-slate-500">
            Quantity
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              isDisabled={displayQuantity <= 0}
              className="min-w-8 px-2"
              onClick={() => setQuantity((prev) => Math.max(prev - 1, 0))}
            >
              -
            </Button>
            <Input
              type="text"
              value={displayQuantity}
              min={0}
              max={safeStock}
              className="w-10 min-w-0 text-center"
              onChange={handleQuantityChange}
            />
            <Button
              variant="outline"
              size="sm"
              isDisabled={displayQuantity >= safeStock}
              className="min-w-8 px-2"
              onClick={() =>
                setQuantity((prev) => Math.min(prev + 1, safeStock))
              }
            >
              +
            </Button>
          </div>
          <Card.Description className="text-[11px] text-slate-500">
            {safeStock} stock(s) left
          </Card.Description>
        </div>
      </div>
      <Card.Footer className="flex gap-2">
        <Button variant="primary" className="w-full">
          Add to Cart
        </Button>
      </Card.Footer>
    </Card>
  );
}
