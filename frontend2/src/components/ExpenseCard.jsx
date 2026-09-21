import { Card, Separator, Typography } from "@heroui/react";

export default function ExpenseCard({ data }) {
  return (
    <Card className="expense-card-in w-full h-auto transition-all hover:scale-101 hover:shadow-lg">
      <Card.Header className="gap-3 flex flex-row justify-between">
        <Typography type="body-lg" weight="semibold">
          {data.category_name}
        </Typography>
        <Typography type="body-sm" color="muted">
          P{data.amount}
        </Typography>
      </Card.Header>
      <Separator />
      <Card.Content className="flex flex-col gap-2 ">
        <Typography type="body-sm" color="muted">
          {data.additional_description}
        </Typography>
      </Card.Content>
      <Card.Footer className="flex justify-between">
        <Typography
          type="body-sm"
          color="default"
          className="flex gap-1 text-blue-500"
        >
          Paid with: {data.method_name}
        </Typography>
        <Typography type="body-sm" color="muted" className="flex gap-1 ms-auto">
          {data.expense_date}
        </Typography>
      </Card.Footer>
    </Card>
  );
}
