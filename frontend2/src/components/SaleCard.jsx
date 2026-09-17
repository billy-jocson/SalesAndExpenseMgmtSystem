import { useEffect, useRef, useState } from "react";
import { Button, Card, Separator, Typography } from "@heroui/react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import CalculaLogo from "../assets/Logo.svg";
import Receipt from "./Receipt";

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
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const targetRef = useRef(null);
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

  useEffect(() => {
    let isActive = true;
    let logoUrl;

    const loadLogo = async () => {
      const response = await fetch(CalculaLogo);
      const svgText = await response.text();
      logoUrl = URL.createObjectURL(
        new Blob([svgText], { type: "image/svg+xml" }),
      );

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 330;
        canvas.height = 104;
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        if (isActive) setLogoDataUrl(canvas.toDataURL("image/png"));
        URL.revokeObjectURL(logoUrl);
      };
      image.src = logoUrl;
    };

    loadLogo();

    return () => {
      isActive = false;
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, []);

  const handleDownloadReceipt = async () => {
    const canvas = await html2canvas(targetRef.current, {
      backgroundColor: "#ffffff",
      logging: false,
      scale: 1,
      useCORS: true,
    });
    const pdf = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm" });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`receipt-${data.transaction_number}.pdf`);
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
            <span className="font-medium">₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Tax</span>
            <span className="font-medium">₱{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-800">
            <span>Total</span>
            <span>₱{totalAmount.toFixed(2)}</span>
          </div>
        </Card.Content>
        <Separator />
        <Card.Footer className="flex justify-between">
          <Button size="sm" onClick={handleDownloadReceipt} isDisabled={!logoDataUrl}>
            Download Receipt
          </Button>
          <Typography type="body-sm" color="muted" className="flex gap-1">
            {data.sale_date}
          </Typography>
        </Card.Footer>
      </Card>
      <div
        ref={targetRef}
        className="mt-3"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          position: "fixed",
          left: "10000px",
          top: 0,
          width: "794px",
          height: "1123px",
          padding: 0,
        }}
      >
        <Receipt data={data} logoSrc={logoDataUrl} />
      </div>
    </>
  );
}
