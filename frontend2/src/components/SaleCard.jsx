import { Button, Card, Separator, Typography } from "@heroui/react";

function SaleItemRow({ name, unitPrice, quantity, subtotal }) {
  return (
    <div className="flex justify-between w-full shadow-sm p-2 rounded-xl">
      <div className="flex flex-col">
        <Typography type="body-sm">{name}</Typography>
        <div className="flex gap-2">
          <Typography type="body-sm" weight="semibold">
            ₱{unitPrice}
          </Typography>
          <Typography type="body-sm">{quantity}x</Typography>
        </div>
      </div>
      <Typography type="body-sm" weight="bold" className="my-auto">
        ₱{subtotal}
      </Typography>
    </div>
  );
}

export default function SaleCard({ data }) {
  return (
    <Card className="w-full hover:scale-101 hover:shadow-lg transition-all">
      <Card.Header className="gap-3">
        <div className="flex gap-5 justify-between">
          <Typography type="body-sm" color="muted">
            {data.transaction_number}
          </Typography>
          <Typography type="body-sm" color="muted" className="flex gap-1">
            <Typography type="body-sm" weight="bold">
              Staff:
            </Typography>
            {data.staff_name}
          </Typography>
        </div>
      </Card.Header>
      <Separator />
      <Card.Content className="flex max-h-32 flex-col gap-2 overflow-y-auto">
        {data.items.map((item, index) => (
          <SaleItemRow key={`${item.name}-${index}`} {...item} />
        ))}
      </Card.Content>
      <Separator />
      <Card.Footer className="flex justify-between">
        <Button size="sm">Download Receipt</Button>
        <Typography type="body-sm" color="muted" className="flex gap-1">
          {data.sale_date}
        </Typography>
      </Card.Footer>
    </Card>
  );
}
