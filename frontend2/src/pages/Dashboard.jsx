import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import DashboardCards from "../components/DashboardCards.jsx";
import { useContext, useEffect, useState } from "react";
import { Wallet } from "@gravity-ui/icons";
import {
  Button,
  DateField,
  DateRangePicker,
  RangeCalendar,
  toast,
} from "@heroui/react";
import { getLocalTimeZone, today } from "@internationalized/date";
import { getAnalytics, getChartData } from "../api/dashboard.js";
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

const data = [
  { name: "Page A", sales: 4000, expense: 2300 },
  { name: "Page B", sales: 3000, expense: 1300 },
  { name: "Page C", sales: 2000, expense: 10000 },
  { name: "Page D", sales: 2700, expense: 3900 },
  { name: "Page E", sales: 1800, expense: 4800 },
  { name: "Page F", sales: 2300, expense: 3800 },
  { name: "Page G", sales: 3500, expense: 4300 },
];

const expenseColors = ["#8884d8", "#82ca9d", "#ffb82e", "#ff7043", "#168bf0"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(userContext);
  const [businessData, setBusinessData] = useState({
    netIncome: 0,
    sales: 0,
    expenses: 0,
    salesStatus: 0,
    expensesStatus: 0,
    netIncomeStatus: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState(() => {
    const currentDate = today(getLocalTimeZone());
    return { start: currentDate, end: currentDate };
  });

  useEffect(() => {
    document.title = "Dashboard";

    const loadAnalytics = async () => {
      const response = await getAnalytics({
        startDate: dateRange.start.toString(),
        endDate: dateRange.end.toString(),
      });

      if (response.status === "success") {
        setBusinessData(response.data);
      }

      const chartResponse = await getChartData();

      if (chartResponse.status === "success") {
        const nextData = Array.isArray(chartResponse.data)
          ? chartResponse.data
          : chartResponse.data
            ? [chartResponse.data]
            : [];
        setChartData(nextData);
      }
    };

    loadAnalytics();
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
      <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
        <TopBar
          title="Dashboard"
          body="See what's happening with your business"
          emoji={dashboardIcon}
        />

        <div className="flex flex-col">
          <div className="flex gap-2 ms-auto">
            <Button
              variant="primary"
              className="rounded-lg text-white"
              onClick={() => navigate("/pos")}
            >
              + New Sale
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
          <div className="flex flex-wrap gap-3 pt-5">
            <DashboardCards
              icon={Wallet}
              status={businessData.netIncomeStatus}
              title="Net Income"
              body={`₱${businessData.netIncome}`}
              highlighted
            />
            <DashboardCards
              icon={Wallet}
              status={businessData.salesStatus}
              title="Total Sales"
              body={`₱${businessData.sales}`}
            />
            <DashboardCards
              icon={Wallet}
              status={businessData.expensesStatus}
              title="Total Expenses"
              body={`₱${businessData.expenses}`}
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
                      <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="lily"
                        name="Sales"
                        stroke="#8884d8"
                        strokeWidth={1.5}
                        dot={{ r: 2, fill: "#8884d8" }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="mike"
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
                        cy="58%"
                        startAngle={180}
                        endAngle={0}
                        outerRadius="78%"
                        paddingAngle={0}
                        label={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={entry.category_name}
                            fill={expenseColors[index % expenseColors.length]}
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
        </div>
      </div>
    </div>
  );
}
