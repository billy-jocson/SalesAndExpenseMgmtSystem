import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// 1. Register a font that supports "₱" using reliable remote Google Fonts URLs
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmWUlfChc9.ttf",
      fontWeight: 700,
    },
  ],
});

// 2. Update your formatters to use the Peso symbol
const formatMoney = (value) => `₱ ${Number(value ?? 0).toFixed(2)}`;

const moneyText = (value) => `₱ ${Number(value ?? 0).toFixed(2)}`;

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 28,
    fontFamily: "Roboto", // 3. Change this from Helvetica to the registered font
  },
  pageContent: {
    width: "100%",
    minHeight: 760,
    position: "relative",
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: 180,
    height: 56,
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#4b5563",
    fontWeight: "bold",
  },
  metaBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#9ca3af",
    paddingVertical: 10,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 11,
    marginBottom: 3,
  },
  itemList: {
    flexGrow: 1,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
  },
  itemNameWrap: {
    flexDirection: "column",
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "bold",
  },
  itemQty: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "bold",
  },
  totalsBox: {
    borderTopWidth: 1,
    borderColor: "#d1d5db",
    paddingTop: 12,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderColor: "#111827",
    paddingTop: 12,
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
  comment: {
    textAlign: "center",
    fontSize: 11,
    color: "#374151",
    marginTop: 18,
  },
  thanks: {
    textAlign: "center",
    fontSize: 11,
    color: "#4b5563",
    marginTop: 18,
  },
});

export function ReceiptPDF({ data, logoSrc }) {
  const subtotal = Number(
    data?.subtotal ??
      (data?.items ?? []).reduce(
        (sum, item) =>
          sum + Number(item?.subtotal ?? item?.unit_price * item?.quantity ?? 0),
        0,
      ) ??
      0,
  );
  const taxAmount = Number(data?.tax_amount ?? 0);
  const totalAmount = Number(data?.total_amount ?? subtotal + taxAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContent}>
          <View style={styles.header}>
            {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
            <Text style={styles.title}>SALES RECEIPT</Text>
          </View>

          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Text>Transaction</Text>
              <Text>{data.transaction_number}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text>Staff</Text>
              <Text>{data.staff_name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text>Date</Text>
              <Text>{data.sale_date}</Text>
            </View>
          </View>

          <View style={styles.itemList}>
            {(data?.items ?? []).map((item, index) => (
              <View
                key={`${item.name}-${index}`}
                style={[
                  styles.itemRow,
                  index === (data?.items ?? []).length - 1 ? { borderBottomWidth: 0 } : {},
                ]}
              >
                <View style={styles.itemNameWrap}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>Qty {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{moneyText(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.summaryRow}>
              <Text>Subtotal</Text>
              <Text>{moneyText(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Tax</Text>
              <Text>{moneyText(taxAmount)}</Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text>Total</Text>
            <Text>{moneyText(totalAmount)}</Text>
          </View>

          <Text style={styles.comment}>"We appreciate your business and hope to serve you again soon."</Text>
          <Text style={styles.thanks}>Thank you for choosing Calcula.</Text>
        </View>
      </Page>
    </Document>
  );
}

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