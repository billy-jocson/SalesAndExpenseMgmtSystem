import { Button, Card, Chip } from "@heroui/react";
import { buildProductImageUrl } from "../api/productmanager.js";

export default function OrderProductModalCard(data) {
  const {
    id,
    name,
    description,
    imagePath,
    category,
    supplier_name,
    supplier_id,
    wholesalePrice,
    onOrder,
  } = data;

  return (
    <Card className="relative flex h-full min-h-[420px] w-full overflow-hidden rounded-2xl bg-white shadow-md">
      <Card.Header className="p-3.5 pb-0">
        <div className="flex h-48 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-2">
          <img
            src={buildProductImageUrl(imagePath)}
            alt={name}
            className="h-full w-full rounded-lg object-contain"
            onError={(event) => {
              event.currentTarget.src = buildProductImageUrl();
            }}
          />
        </div>
      </Card.Header>

      <Card.Content className="flex flex-1 flex-col pt-3 px-4">
        <div className="flex min-h-8 flex-col justify-between gap-2">
          <h2 className="min-w-0 truncate text-[15px] font-semibold text-gray-900">
            {name}
          </h2>
          <Chip size="sm" variant="secondary" className="w-fit">
            {category}
          </Chip>
        </div>

        <p className="mt-2 line-clamp-2 min-h-10 text-[13px] text-gray-500">
          {description || "No description available."}
        </p>

        <div className="mt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Supplier
          </p>
          <p className="truncate text-sm font-medium text-gray-800">
            {supplier_name}
          </p>
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Wholesale Price
          </p>
          <p className="text-sm font-semibold text-blue-600">
            ₱{Number(wholesalePrice).toFixed(2)}
          </p>
        </div>
      </Card.Content>

      <Card.Footer className="pt-3 px-4 pb-4">
        <Button
          variant="primary"
          className="w-full"
          onClick={() => onOrder({ 
            id, 
            name, 
            wholesalePrice, 
            imagePath,
            supplier_id,
            supplier_name,
            supplier_product_id: id
          })}
        >
          Order
        </Button>
      </Card.Footer>
    </Card>
  );
}
