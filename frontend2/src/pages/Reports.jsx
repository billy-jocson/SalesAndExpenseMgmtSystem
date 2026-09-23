import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useEffect, useMemo, useState } from "react";
import reports from "../assets/images/reports.png";
import DashboardCards from "../components/DashboardCards.jsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, Dropdown, Label, Table, Typography } from "@heroui/react";
import { getReportSummary } from "../api/reports.js";
import { usePDF } from "react-to-pdf";
import { ChartSkeleton, TableSkeleton } from "../components/PageSkeleton.jsx";

const expenseColors = ["#8884d8", "#82ca9d", "#ffb82e", "#ff7043", "#168bf0"];
const categoryColors = ["#8884d8", "#82ca9d", "#ffb82e", "#ff7043", "#168bf0"];
const periodRanges = {
  Today: 0,
  "This Week": 6,
  "This Month": null,
  "This Year": null,
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const getRangeForPeriod = (period) => {
  const end = new Date();
  const start = new Date(end);

  if (period === "This Month") start.setDate(1);
  else if (period === "This Year") start.setMonth(0, 1);
  else start.setDate(end.getDate() - periodRanges[period]);

  return { startDate: formatDate(start), endDate: formatDate(end) };
};

const currency = (value) =>
  `₱${Number(value ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Reports() {
  const [period, setPeriod] = useState("Today");
  const [report, setReport] = useState(null);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "total_sales",
    direction: "descending",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toPDF, targetRef } = usePDF({
    filename: "calcula-financial-report.pdf",
    method: "save",
    resolution: 3,
    page: { margin: 10 },
    overrides: {
      canvas: { useCORS: true },
    },
  });

  useEffect(() => {
    document.title = "Reports";
  }, []);

  useEffect(() => {
    let active = true;
    const loadReport = async () => {
      setLoading(true);
      setError("");
      const response = await getReportSummary(getRangeForPeriod(period));
      if (!active) return;
      if (response.status !== "success") {
        setError(response.message ?? "Unable to load report data.");
        setReport(null);
      } else setReport(response.data);
      setLoading(false);
    };
    loadReport();
    return () => {
      active = false;
    };
  }, [period]);

  const products = useMemo(() => {
    const rows = [...(report?.topProducts ?? [])];
    const multiplier = sortDescriptor.direction === "ascending" ? 1 : -1;
    return rows.sort((first, second) => {
      const firstValue = first[sortDescriptor.column];
      const secondValue = second[sortDescriptor.column];
      const comparison =
        typeof firstValue === "string"
          ? firstValue.localeCompare(secondValue)
          : Number(firstValue) - Number(secondValue);
      return comparison * multiplier;
    });
  }, [report, sortDescriptor]);

  const totals = report?.totals ?? { sales: 0, expenses: 0, profitLoss: 0 };
  const profit = Math.max(Number(totals.profitLoss), 0);
  const loss = Math.max(Number(totals.profitLoss) * -1, 0);

  return (
    <div className="flex gap-3 print:m-0 print:block [&>nav]:print:hidden">
      <Navbar />
      <div className="flex w-full gap-3 print:hidden">
        <div className="flex max-h-[calc(100dvh-2rem)] w-full flex-col gap-3 overflow-y-scroll rounded-[1.75rem] p-7 shadow-md">
          <TopBar
            title="Reports"
            body="Track the status of your business."
            emoji={reports}
          />
          <div className="flex flex-col">
            <div className="ms-auto flex gap-2">
              <Button
                variant="primary"
                className="rounded-lg"
                onClick={() => window.print()}
              >
                Print Report
              </Button>
              <Button
                variant="secondary"
                className="rounded-lg"
                onClick={() => toPDF()}
              >
                Download Report
              </Button>
              <Dropdown>
                <Button
                  aria-label="Report period"
                  variant="secondary"
                  className="rounded-lg"
                >
                  {period}
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu onAction={(key) => setPeriod(String(key))}>
                    {Object.keys(periodRanges).map((option) => (
                      <Dropdown.Item
                        key={option}
                        id={option}
                        textValue={option}
                      >
                        <Label>{option}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <DashboardCards
              title="Profit Gain"
              highlighted
              status={0}
              body={currency(profit)}
            />
            <DashboardCards
              title="Profit Loss"
              status={0}
              body={currency(loss)}
            />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-md">
              <Typography color="default" weight="semibold">
                Sold Products per Category
              </Typography>
              <Typography color="muted" type="body-sm">
                Units sold grouped by product category.
              </Typography>
              <div className="h-72 w-full">
                {loading ? (
                  <ChartSkeleton />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report?.productCategories ?? []}
                        dataKey="total_qty"
                        nameKey="category_name"
                        cx="50%"
                        cy="45%"
                        outerRadius="62%"
                      >
                        {(report?.productCategories ?? []).map(
                          (entry, index) => (
                            <Cell
                              key={entry.category_name}
                              fill={
                                categoryColors[index % categoryColors.length]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          `${Number(value).toLocaleString()} units`
                        }
                      />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-md">
              <h2 className="text-lg font-semibold text-zinc-800">
                Revenue vs Expenses
              </h2>
              <p className="mb-5 text-sm text-zinc-500">
                Monthly performance for the selected period.
              </p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report?.trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="report_month" />
                    <YAxis />
                    <Tooltip formatter={(value) => currency(value)} />
                    <Legend />
                    <Bar dataKey="total_sales" name="Revenue" fill="#168bf0" />
                    <Bar
                      dataKey="total_expenses"
                      name="Expenses"
                      fill="#ff7043"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-5 shadow-md">
            <Typography color="default" weight="semibold">
              Top Selling Products
            </Typography>
            <Typography color="muted" type="body-sm">
              Ranked by total revenue in the selected period.
            </Typography>
            <Table className="mt-3">
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Top selling products"
                  sortDescriptor={sortDescriptor}
                  onSortChange={setSortDescriptor}
                >
                  <Table.Header>
                    <Table.Column>#</Table.Column>
                    <Table.Column id="product_name" allowsSorting>
                      Product Name
                    </Table.Column>
                    <Table.Column id="total_qty" allowsSorting>
                      Units Sold
                    </Table.Column>
                    <Table.Column id="total_sales" allowsSorting>
                      Revenue
                    </Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {products.map((product, index) => (
                      <Table.Row key={product.product_name}>
                        <Table.Cell>{index + 1}</Table.Cell>
                        <Table.Cell>{product.product_name}</Table.Cell>
                        <Table.Cell>{product.total_qty}</Table.Cell>
                        <Table.Cell>
                          <Typography
                            type="body-sm"
                            weight="semibold"
                            className="text-blue-500"
                          >
                            {currency(product.total_sales)}
                          </Typography>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-md">
            <Typography color="default" weight="semibold">
              Expense Breakdown by Category
            </Typography>
            <Typography color="muted" type="body-sm">
              Distribution of expenses across the selected period.
            </Typography>
            <div className="h-72 w-full">
              {loading ? (
                <TableSkeleton columns={5} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report?.expenses ?? []}
                      dataKey="total_amount"
                      nameKey="category_name"
                      cx="50%"
                      cy="45%"
                      outerRadius="70%"
                    >
                      {(report?.expenses ?? []).map((entry, index) => (
                        <Cell
                          key={entry.category_name}
                          fill={expenseColors[index % expenseColors.length]}
                        />
                      ))}
                      {/* Gemini lang sakalam LOL */}
                    </Pie>
                    <Tooltip formatter={(value) => currency(value)} />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        ref={targetRef}
        className="fixed left-[-10000px] top-0 block w-[8.5in] bg-white font-[Arial,sans-serif] text-[9px] text-[#172033] print:static print:w-auto"
        aria-hidden="true"
      >
        <header className="flex items-start justify-between border-b-2 border-[#172033] py-2 pb-3">
          <strong className="text-2xl tracking-[-1.5px]">
            Calcula<span>•</span>
          </strong>
          <div className="text-right">
            <h1 className="m-0 text-[15px]">FINANCIAL AUDIT REPORT</h1>
            <p className="m-0 text-[8px] text-[#718096]">
              Generated:{" "}
              {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
            <p className="m-0 text-[8px] text-[#718096]">
              Document Ref: #CC-2026-0901
            </p>
          </div>
        </header>
        <section>
          <div className="my-3.5 mb-2 border-b border-[#dbe2ea] pb-1">
            <h2 className="m-0 text-[11px] tracking-[0.3px]">
              PERFORMANCE OVERVIEW
            </h2>
            <p className="m-0 text-[8px] text-[#718096]">
              High-level balance statement of active operations
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <article className="rounded-[7px] border border-[#dbe2ea] bg-[#f8fafc] p-3">
              <span className="block text-[8px] font-bold text-[#667085]">
                PROFIT GAIN
              </span>
              <strong className="mt-2 block text-[19px]">
                {currency(profit)}
              </strong>
            </article>
            <article className="rounded-[7px] border border-[#dbe2ea] bg-[#f8fafc] p-3">
              <span className="block text-[8px] font-bold text-[#667085]">
                PROFIT LOSS
              </span>
              <strong className="mt-2 block text-[19px]">
                {currency(loss)}
              </strong>
            </article>
            <article className="rounded-[7px] border border-[#dbe2ea] bg-[#f8fafc] p-3">
              <span className="block text-[8px] font-bold text-[#667085]">
                NET OPERATING BALANCE
              </span>
              <strong className="mt-2 block text-[19px]">
                {currency(totals.profitLoss)}
              </strong>
            </article>
          </div>
        </section>
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <section className="rounded-[7px] border border-[#dbe2ea] bg-[#f8fafc] p-2.5">
            <h2 className="m-0 text-[10px]">Products sold by category</h2>
            <div className="h-[170px] w-full">
              <PieChart width={300} height={160}>
                <Pie
                  data={report?.productCategories ?? []}
                  dataKey="total_qty"
                  nameKey="category_name"
                  cx="50%"
                  cy="43%"
                  outerRadius="68%"
                >
                  {/* Halos wala ako na tulong dito ah ndi ko magamay ung react with heroui */}
                  {(report?.productCategories ?? []).map((entry, index) => (
                    <Cell
                      key={entry.category_name}
                      fill={categoryColors[index % categoryColors.length]}
                    />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" />
              </PieChart>
            </div>
          </section>
          <section className="rounded-[7px] border border-[#dbe2ea] bg-[#f8fafc] p-2.5">
            <h2 className="m-0 text-[10px]">Revenue vs Expenses (Monthly)</h2>
            <div className="h-[170px] w-full">
              <BarChart width={300} height={160} data={report?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="report_month" />
                <YAxis />
                <Legend verticalAlign="bottom" />
                <Bar dataKey="total_sales" name="Revenue" fill="#168bf0" />
                <Bar dataKey="total_expenses" name="Expenses" fill="#ff7043" />
              </BarChart>
            </div>
          </section>
        </div>
        <section>
          <div className="my-3.5 mb-2 border-b border-[#dbe2ea] pb-1">
            <h2 className="m-0 text-[11px] tracking-[0.3px]">
              TOP SELLING PRODUCTS
            </h2>
            <p className="m-0 text-[8px] text-[#718096]">
              Ranked list of products by total revenue generated this period
            </p>
          </div>
          <table className="w-full border-collapse [&_td]:border-b [&_td]:border-[#dbe2ea] [&_td]:px-[9px] [&_td]:py-[7px] [&_td]:text-left [&_th]:border-b [&_th]:border-[#dbe2ea] [&_th]:bg-[#f1f5f9] [&_th]:px-[9px] [&_th]:py-[7px] [&_th]:text-left [&_th]:text-[8px] [&_td:nth-child(3)]:text-right [&_th:nth-child(3)]:text-right [&_td:last-child]:text-right [&_th:last-child]:text-right">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {/* etong buong line 238 gang 241 lang ata nagalaw ko eh hhshshhshshs */}
              {products.slice(0, 4).map((product, index) => (
                <tr key={product.product_name}>
                  <td>{index + 1}</td>
                  <td>{product.product_name}</td>
                  <td>{Number(product.total_qty).toLocaleString()}</td>
                  <td>{currency(product.total_sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-2.5">
          <section>
            <div className="my-3.5 mb-2 border-b border-[#dbe2ea] pb-1">
              <h2 className="m-0 text-[11px] tracking-[0.3px]">
                EXPENSE BREAKDOWN
              </h2>
            </div>
            {(report?.expenses ?? []).map((expense, index) => (
              <div
                className="relative border-b border-[#edf1f5] py-1 pb-2"
                key={expense.category_name}
              >
                <span>{expense.category_name}</span>
                <strong className="float-right">
                  {currency(expense.total_amount)}
                </strong>
                {/* Look at this woooooo */}
                <i
                  style={{
                    width: `${Math.max(12, Math.min(100, (Number(expense.total_amount) / Math.max(Number(totals.expenses), 1)) * 100))}%`,
                    backgroundColor:
                      expenseColors[index % expenseColors.length],
                  }}
                  className="mt-1 block h-1"
                />
              </div>
            ))}
          </section>
          <section className="rounded-[7px] border border-[#dbe2ea] bg-[#f8fafc] p-3.5">
            <h2 className="m-0 text-[9px]">AUDIT VERIFICATION</h2>
            <p className="m-0 mt-3.5 leading-[1.5] text-[#718096]">
              This report represents a true and accurate summary of Calcula
              ledger systems as of the audit generation timestamp.
            </p>
            <div className="mt-7 border-b border-[#718096]" />
            <span className="mt-1 block text-center text-[8px] text-[#718096]">
              Authorized Signature
            </span>
          </section>
        </div>
        <footer className="mt-6 flex justify-between border-t border-[#dbe2ea] pt-2 text-[8px] text-[#a0aec0]">
          <span>Calcula Sales &amp; Expense Management System</span>
          <span>Page 1 of 1</span>
        </footer>
      </div>
    </div>
  );
}
