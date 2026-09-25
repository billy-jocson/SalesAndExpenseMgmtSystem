import { Card, Button } from "@heroui/react";
import QtyButtons from "./QtyButtons.jsx";
import { useState } from "react";

export default function POSProductCard({
  id,
  image,
  name,
  price,
  stock,
  onAddToCart,
}) {
  const safeStock = Number(stock) || 0;
  const [quantity, setQuantity] = useState(0);
  const imagePath = `/backend/public${image}`;

  function addtoCart() {
    if (quantity > 0) {
      onAddToCart({ id, name, price, stock: safeStock }, quantity);

      // Resets back to 0. QtyButtons will now visually respect this reset.
      setQuantity(0);
    }
  }

  return (
    <Card className="w-auto grow gap-2 shadow-md">
      <img
        alt={name}
        className="pointer-events-none aspect-square w-56 mx-auto rounded-2xl object-cover select-none"
        loading="lazy"
        src={imagePath}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Card.Header className="p-0">
            <Card.Title className="text-sm font-semibold">{name}</Card.Title>
            <Card.Description className="text-sm font-medium">
              ₱{price}
            </Card.Description>
          </Card.Header>
        </div>

        <div className="flex min-w-[118px] flex-col items-end gap-1">
          <span className="text-[11px] font-medium text-slate-500">
            Quantity
          </span>
          {/* Changed initialQuantity to value to enforce controlled reactivity */}
          <QtyButtons
            stock={safeStock}
            value={quantity}
            onChange={setQuantity}
          />
          <Card.Description className="text-[11px] text-slate-500">
            {safeStock} stock(s) left
          </Card.Description>
        </div>
      </div>
      <Card.Footer className="flex gap-2">
        <Button
          variant="primary"
          className="w-full"
          onPress={addtoCart}
          isDisabled={quantity === 0 || safeStock === 0}
        >
          Add to Cart
        </Button>
      </Card.Footer>
    </Card>
  );
}
