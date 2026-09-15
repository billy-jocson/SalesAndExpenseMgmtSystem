const formatMoney = (value) => `₱${Number(value ?? 0).toFixed(2)}`;

export default function Receipt({ data, logoSrc }) {
  const watermarkLogos = Array.from({ length: 20 });

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "794px",
        height: "1123px",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
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
          padding: "36px 32px",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      >
        {watermarkLogos.map((_, index) => (
          <img
            key={index}
            src={logoSrc}
            alt=""
            style={{ width: "100px", alignSelf: "center" }}
          />
        ))}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "520px",
          padding: "38px 42px 34px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          boxSizing: "border-box",
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "24px" }}>
          <img
            src={logoSrc}
            alt="Calcula"
            style={{ width: "190px", margin: "0 auto 12px" }}
          />
          <div
            style={{
              fontSize: "11px",
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
            padding: "10px 0",
            fontSize: "12px",
            lineHeight: 1.7,
          }}
        >
          <div>Transaction: {data.transaction_number}</div>
          <div>Staff: {data.staff_name}</div>
          <div>Date: {data.sale_date}</div>
        </section>

        <section style={{ margin: "18px 0", fontSize: "12px" }}>
          {data.items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "10px",
              }}
            >
              <span>
                {item.name} × {item.quantity}
              </span>
              <span style={{ fontWeight: 700 }}>{formatMoney(item.subtotal)}</span>
            </div>
          ))}
        </section>

        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px solid #111827",
            paddingTop: "12px",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          <span>Total</span>
          <span>{formatMoney(data.total_amount)}</span>
        </footer>

        <p
          style={{
            marginTop: "32px",
            textAlign: "center",
            fontSize: "11px",
            color: "#4b5563",
          }}
        >
          Thank you for choosing Calcula.
        </p>
      </div>
    </div>
  );
}
