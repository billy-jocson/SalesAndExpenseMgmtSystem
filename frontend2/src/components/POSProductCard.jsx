import { Card, Button } from "@heroui/react";
import QtyButtons from "./QtyButtons.jsx";

export default function POSProductCard({ name, price, stock }) {
  const safeStock = Number(stock) || 0;

  return (
    <Card className="w-auto grow gap-2 shadow-md">
      <img
        alt="Indie Hackers community"
        className="pointer-events-none aspect-square w-fit mx-auto rounded-2xl object-cover select-none"
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
          <QtyButtons stock={safeStock} />
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
