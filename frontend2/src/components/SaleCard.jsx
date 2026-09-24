import { useState } from "react";
import { Button, Card, Separator, Typography } from "@heroui/react";
import { pdf } from "@react-pdf/renderer";
import { ReceiptPDF } from "./Receipt";

function SaleItemRow({ name, unitPrice, quantity, subtotal }) {
  return (
    <div className="flex justify-between w-full shadow-sm p-2 rounded-xl">
      <div className="flex flex-col">
        <Typography type="body-sm">{name}</Typography>
        <div className="flex gap-2">
          <Typography type="body-sm" weight="semibold">
            PHP {unitPrice}
          </Typography>
          <Typography type="body-sm">{quantity}x</Typography>
        </div>
      </div>
      <Typography type="body-sm" weight="bold" className="my-auto">
        PHP {subtotal}
      </Typography>
    </div>
  );
}

export default function SaleCard({ data }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const subtotal = Number(
    data?.subtotal ??
      (data?.items ?? []).reduce(
        (sum, item) => sum + Number(item?.subtotal ?? item?.unit_price * item?.quantity ?? 0),
        0,
      ) ??
      0,
  );
  const taxAmount = Number(data?.tax_amount ?? 0);
  const totalAmount = Number(data?.total_amount ?? subtotal + taxAmount);

  const handleDownloadReceipt = async () => {
    setIsGenerating(true);
    setDownloadError("");
    try {
      const blob = await pdf(<ReceiptPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${data.transaction_number || "sale"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Unable to generate sales receipt PDF:", error);
      setDownloadError("Could not create the receipt PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className="w-full hover:scale-101 hover:shadow-lg transition-all">
        <Card.Header className="gap-3">
          <div className="flex gap-5 justify-between">
            <Typography type="body-sm" color="muted">
              {data.transaction_number}
            </Typography>
            <div className="flex gap-1">
              <Typography type="body-sm" weight="bold">
                Staff:
              </Typography>
              <Typography type="body-sm" color="muted">
                {data.staff_name}
              </Typography>
            </div>
          </div>
        </Card.Header>
        <Separator />
        <Card.Content className="flex max-h-32 flex-col gap-2 overflow-y-auto">
          {data.items.map((item, index) => (
            <SaleItemRow key={`${item.name}-${index}`} {...item} />
          ))}
        </Card.Content>
        <Separator />
        <Card.Content className="space-y-2 pt-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-medium">PHP {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Tax</span>
            <span className="font-medium">PHP {taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-800">
            <span>Total</span>
            <span>PHP {totalAmount.toFixed(2)}</span>
          </div>
        </Card.Content>
        <Separator />
        <Card.Footer className="flex justify-between">
          <Button size="sm" onClick={handleDownloadReceipt} isDisabled={isGenerating}>
            {isGenerating ? "Preparing PDF..." : "Download Receipt"}
          </Button>
          <Typography type="body-sm" color="muted" className="flex gap-1">
            {data.sale_date}
          </Typography>
        </Card.Footer>
        {downloadError && (
          <p role="alert" className="px-4 pb-3 text-sm text-red-600">
            {downloadError}
          </p>
        )}
      </Card>
    </>
  );
}
