const formatMoney = (value) => `₱${Number(value ?? 0).toFixed(2)}`;

export default function Receipt({ data, logoSrc }) {
  const watermarkLogos = Array.from({ length: 20 });
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

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          justifyItems: "center",
          padding: "42px 36px",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      >
        {watermarkLogos.map((_, index) => (
          <img
            key={index}
            src={logoSrc}
            alt=""
            style={{ width: "120px", alignSelf: "center" }}
          />
        ))}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          padding: "38px 48px 34px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "22px" }}>
          <img
            src={logoSrc}
            alt="Calcula"
            style={{ width: "220px", margin: "0 auto 14px" }}
          />
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "2px",
              color: "#4b5563",
            }}
          >
            SALES RECEIPT
          </div>
        </header>

        <section
          style={{
            borderTop: "1px solid #9ca3af",
            borderBottom: "1px solid #9ca3af",
            padding: "12px 0",
            fontSize: "13px",
            lineHeight: 1.8,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span>Transaction</span>
            <strong>{data.transaction_number}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span>Staff</span>
            <strong>{data.staff_name}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span>Date</span>
            <strong>{data.sale_date}</strong>
          </div>
        </section>

        <section
          style={{
            margin: "18px 0 0",
            fontSize: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flex: 1,
          }}
        >
          {data.items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                paddingBottom: "10px",
                borderBottom: index === data.items.length - 1 ? "none" : "1px dashed #d1d5db",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{item.name}</span>
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  Qty {item.quantity}
                </span>
              </div>
              <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{formatMoney(item.subtotal)}</span>
            </div>
          ))}
        </section>

        <div
          style={{
            marginTop: "18px",
            paddingTop: "12px",
            borderTop: "1px solid #d1d5db",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "15px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span>Tax</span>
            <span>{formatMoney(taxAmount)}</span>
          </div>
        </div>

        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "2px solid #111827",
            paddingTop: "16px",
            fontSize: "20px",
            fontWeight: 700,
            marginTop: "12px",
          }}
        >
          <span>Total</span>
          <span>{formatMoney(totalAmount)}</span>
        </footer>

        <p
          style={{
            marginTop: "auto",
            textAlign: "center",
            fontSize: "12px",
            color: "#4b5563",
            letterSpacing: "0.04em",
          }}
        >
          Thank you for choosing Calcula.
        </p>
      </div>
    </div>
  );
}
