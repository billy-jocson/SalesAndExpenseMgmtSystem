// Imports
import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import DashboardCards from "../components/DashboardCards.jsx";
import { useContext, useEffect, useState } from "react";
import { Wallet, Box, CirclePlusFill } from "@gravity-ui/icons";
import {
  Button,
  DateField,
  DateRangePicker,
  RangeCalendar,
  toast,
} from "@heroui/react";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
  getAnalytics,
  getChartData,
  getLineChartData,
  getSupplierProductAnalytics,
} from "../api/dashboard.js";
import dashboardIcon from "../assets/images/dashboard.png";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AddExpenseModal from "../components/AddExpenseModal.jsx";
import { userContext } from "../context/UserContext.js";
import { useNavigate } from "react-router-dom";

// Pie chart colors
const expenseColors = [
  "#8884d8",
  "#82ca9d",
  "#ffb82e",
  "#ff7043",
  "#168bf0",
  "#df05fc",
];

// Main dashboard page
export default function Dashboard() {
  // Used for the new sale button to navigat to pos page
  const navigate = useNavigate();

  // Contains current user information from the session
  const { user } = useContext(userContext);
  const [businessData, setBusinessData] = useState({
    netIncome: 0,
    sales: 0,
    expenses: 0,
    salesStatus: 0,
    expensesStatus: 0,
    netIncomeStatus: 0,
  });
  const [productData, setProductData] = useState({
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState(() => {
    const currentDate = today(getLocalTimeZone());
    const oneMonthAgo = currentDate.subtract({ months: 1 });

    return {
      start: oneMonthAgo,
      end: currentDate,
    };
  });

  useEffect(() => {
    document.title = "Dashboard";

    const loadAnalytics = async () => {
      const dateParams = {
        startDate: dateRange.start.toString(),
        endDate: dateRange.end.toString(),
      };

      const [analyticsRes, chartRes, lineChartRes] = await Promise.allSettled([
        getAnalytics(dateParams),
        getChartData(dateParams),
        getLineChartData(dateParams),
      ]);

      if (
        analyticsRes.status === "fulfilled" &&
        analyticsRes.value?.status === "success"
      ) {
        setBusinessData(analyticsRes.value.data);
        if (analyticsRes.value.data?.productData) {
          setProductData(analyticsRes.value.data.productData);
        }
      }

      if (
        chartRes.status === "fulfilled" &&
        chartRes.value?.status === "success"
      ) {
        const nextData = Array.isArray(chartRes.value.data)
          ? chartRes.value.data.map((item) => ({
              ...item,
              total_amount: Number(item.total_amount),
            }))
          : [];
        setChartData(nextData);
      }

      if (
        lineChartRes.status === "fulfilled" &&
        lineChartRes.value?.status === "success"
      ) {
        const formattedData = (lineChartRes.value.data || []).map((item) => ({
          ...item,
          sales: Number(item.sales),
          expense: Number(item.expense),
        }));
        setData(formattedData);
      }
    };
    const fetchProductMetrics = async () => {
      try {
        const response = await getSupplierProductAnalytics({
          supplierId: user?.supplier_id,
        });

        if (response?.status === "success" && response?.data) {
          setProductData({
            totalProducts: response.data.totalProducts ?? 0,
            totalRevenue: response.data.totalRevenue ?? 0,
          });
        } else {
          toast.danger(`API Error: ${response?.message}`);
        }
      } catch (error) {
        toast.danger(`Failed to load product analytics: ${error}`);
      }
    };

    if (user?.role === "Administrator") {
      loadAnalytics();
    } else {
      fetchProductMetrics();
    }
  }, [dateRange]);

  useEffect(() => {
    if (
      user?.first_name &&
      sessionStorage.getItem("dashboardWelcomeToast") === "1"
    ) {
      sessionStorage.removeItem("dashboardWelcomeToast");
      toast.success(`Welcome back, ${user.first_name}`);
    }
  }, [user?.first_name]);

  return (
    <div className="flex gap-3">
      <Navbar />
      <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll min-h-[calc(100vh-2rem)]">
        <TopBar
          title="Dashboard"
          body={
            user?.role === "Administrator"
              ? "See what's happening with your business"
              : "See all sales within your supplier business"
          }
          emoji={dashboardIcon}
        />

        <div className="flex flex-col flex-1">
          {user?.role === "Administrator" ? (
            <>
              <div className="flex flex-col md:flex-row md:ms-auto gap-2 mb-5">
                <Button
                  variant="primary"
                  className="rounded-lg text-white w-full"
                  onClick={() => navigate("/pos")}
                >
                  <CirclePlusFill className="size-4" />
                  New Sale
                </Button>
                <AddExpenseModal />
                <DateRangePicker value={dateRange} onChange={setDateRange}>
                  <DateField.Group>
                    <DateField.InputContainer>
                      <DateField.Input slot="start">
                        {(segment) => <DateField.Segment segment={segment} />}
                      </DateField.Input>
                      <DateRangePicker.RangeSeparator />
                      <DateField.Input slot="end">
                        {(segment) => <DateField.Segment segment={segment} />}
                      </DateField.Input>
                    </DateField.InputContainer>
                    <DateField.Suffix>
                      <DateRangePicker.Trigger>
                        <DateRangePicker.TriggerIndicator />
                      </DateRangePicker.Trigger>
                    </DateField.Suffix>
                  </DateField.Group>
                  <DateRangePicker.Popover>
                    <RangeCalendar aria-label="Choose dashboard date range">
                      <RangeCalendar.Header>
                        <RangeCalendar.YearPickerTrigger>
                          <RangeCalendar.YearPickerTriggerHeading />
                          <RangeCalendar.YearPickerTriggerIndicator />
                        </RangeCalendar.YearPickerTrigger>
                        <RangeCalendar.NavButton slot="previous" />
                        <RangeCalendar.NavButton slot="next" />
                      </RangeCalendar.Header>
                      <RangeCalendar.Grid>
                        <RangeCalendar.GridHeader>
                          {(day) => (
                            <RangeCalendar.HeaderCell>
                              {day}
                            </RangeCalendar.HeaderCell>
                          )}
                        </RangeCalendar.GridHeader>
                        <RangeCalendar.GridBody>
                          {(date) => <RangeCalendar.Cell date={date} />}
                        </RangeCalendar.GridBody>
                      </RangeCalendar.Grid>
                    </RangeCalendar>
                  </DateRangePicker.Popover>
                </DateRangePicker>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <DashboardCards
                  icon={Wallet}
                  status={businessData.netIncomeStatus}
                  title="Net Income"
                  body={`${businessData.netIncome.toLocaleString("en-US", { style: "currency", currency: "PHP" })}`}
                  highlighted
                />
                <DashboardCards
                  icon={Wallet}
                  status={businessData.salesStatus}
                  title="Total Sales"
                  body={`${businessData.sales.toLocaleString("en-US", { style: "currency", currency: "PHP" })}`}
                />
                <DashboardCards
                  icon={Wallet}
                  status={businessData.expensesStatus}
                  title="Total Expenses"
                  body={`${businessData.expenses.toLocaleString("en-US", { style: "currency", currency: "PHP" })}`}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {/* LINE GRAPH CHART */}
                <div className="mt-5 rounded-lg bg-white p-5 shadow-md">
                  <h2 className="text-lg font-semibold text-zinc-800">
                    Sales vs. Expense Trend
                  </h2>
                  <p className="mb-5 text-sm text-zinc-500">
                    Track your sales and expense here.
                  </p>
                  <div className="h-72 w-full">
                    {data && data.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={data}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            stroke="#e4e4e7"
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="_date"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="sales"
                            name="Sales"
                            stroke="#8884d8"
                            strokeWidth={1.5}
                            dot={{ r: 2, fill: "#8884d8" }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="expense"
                            name="Expenses"
                            stroke="#68c58d"
                            strokeWidth={1.5}
                            dot={{ r: 2, fill: "#68c58d" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
                        No data exists yet in the database.
                      </div>
                    )}
                  </div>
                </div>

                {/* PIE CHART */}
                <div className="mt-5 rounded-lg bg-white p-5 shadow-md">
                  <h2 className="text-lg font-semibold text-zinc-800">
                    Expense Breakdown
                  </h2>
                  <p className="mb-5 text-sm text-zinc-500">
                    See where you spend your revenue.
                  </p>
                  <div className="h-72 w-full">
                    {chartData && chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="total_amount"
                            nameKey="category_name"
                            cx="50%"
                            cy="45%"
                            outerRadius="78%"
                            paddingAngle={0}
                            label={false}
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={entry.category_name}
                                fill={
                                  expenseColors[index % expenseColors.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Legend verticalAlign="bottom" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
                        No data exists yet in the database.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-3">
              <DashboardCards
                icon={Box}
                status={100}
                title="Total Products"
                body={(productData.totalProducts ?? 0).toLocaleString()}
                highlighted
                noChip
              />
              <DashboardCards
                icon={Wallet}
                status={100}
                title="Total Revenue"
                body={`₱${(productData.totalRevenue ?? 0).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                )}`}
                noChip
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
