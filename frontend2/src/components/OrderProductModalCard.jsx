import { Button, Card, Chip } from "@heroui/react";
import { buildProductImageUrl } from "../api/productmanager.js";

export default function OrderProductModalCard(data) {
  const {
    name,
    description,
    image_path,
    category,
    supplier_name,
    wholesaleprice,
    onOrder,
  } = data;

  return (
    <Card className="relative flex h-full min-h-90 w-full overflow-hidden rounded-2xl bg-white shadow-md">
      <Card.Header className="p-3.5 pb-0">
        <div className="flex h-48 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 p-2">
          <img
            src={buildProductImageUrl(image_path)}
            alt={name}
            className="h-full w-full rounded-lg object-cover"
            onError={(event) => {
              event.currentTarget.src = buildProductImageUrl();
            }}
          />
        </div>
      </Card.Header>

      <Card.Content className="flex flex-1 flex-col pt-3">
        <div className="flex min-h-8 flex-col justify-between gap-2">
          <h2 className="min-w-0 truncate text-base font-semibold text-gray-900">
            {name}
          </h2>
          <Chip size="sm" variant="secondary">
            {category}
          </Chip>
        </div>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-gray-500">
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
            Wholesale price
          </p>
          <p className="text-sm font-semibold text-blue-600">
            ₱{wholesaleprice}
          </p>
        </div>
      </Card.Content>

      <Card.Footer className="pt-0">
        <Button
          variant="primary"
          className="w-full"
          onClick={() => onOrder(data)}
        >
          Order
        </Button>
      </Card.Footer>
    </Card>
  );
}
