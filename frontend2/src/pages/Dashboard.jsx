import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import DashboardCards from "../components/DashboardCards.jsx";
import { useEffect } from "react";
import { Wallet } from "@gravity-ui/icons";
import { Button, Dropdown, Label } from "@heroui/react";
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

const data = [
  { name: "Page A", sales: 4000, expense: 2300 },
  { name: "Page B", sales: 3000, expense: 1300 },
  { name: "Page C", sales: 2000, expense: 10000 },
  { name: "Page D", sales: 2700, expense: 3900 },
  { name: "Page E", sales: 1800, expense: 4800 },
  { name: "Page F", sales: 2300, expense: 3800 },
  { name: "Page G", sales: 3500, expense: 4300 },
];

const expenseData = [
  { name: "Lily", value: 400 },
  { name: "Mike", value: 300 },
  { name: "Matt", value: 220 },
  { name: "Leila", value: 140 },
  { name: "Jack", value: 80 },
];

const expenseColors = ["#8884d8", "#82ca9d", "#ffb82e", "#ff7043", "#168bf0"];

import dashboardIcon from "../assets/images/dashboard.png";

export default function Dashboard() {
  useEffect(() => {
    document.title = "Dashboard";
  }, []);

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
              onClick={null}
            >
              + New Sale
            </Button>
            <Button
              variant="secondary"
              className="bg-purple-600 rounded-lg text-white"
              onClick={null}
            >
              + Add Expense
            </Button>
            <Dropdown>
              <Button
                aria-label="Menu"
                variant="secondary"
                className="rounded-lg"
              >
                Today
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  onAction={(key) => console.log(`Selected: ${key}`)}
                >
                  <Dropdown.Item id="new-file" textValue="New file">
                    <Label>Today</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="copy-link" textValue="Copy link">
                    <Label>This Week</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="edit-file" textValue="Edit file">
                    <Label>This Month</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
          <div className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCards
              icon={Wallet}
              status={25}
              title="Net Income"
              body="₱15,000"
              highlighted
            />
            <DashboardCards
              icon={Wallet}
              status={25}
              title="Total Sales"
              body="₱15,000"
            />
            <DashboardCards
              icon={Wallet}
              status={-25}
              title="Total Expenses"
              body="₱15,000"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="mt-5 rounded-lg bg-white p-5 shadow-md">
              <h2 className="text-lg font-semibold text-zinc-800">
                Sales vs. Expense Trend
              </h2>
              <p className="mb-5 text-sm text-zinc-500">
                Lorem ipsum tortor et eu egestas id quam.
              </p>
              <div className="h-72 w-full">
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
                      dataKey="sales"
                      name="Lily"
                      stroke="#8884d8"
                      strokeWidth={1.5}
                      dot={{ r: 2, fill: "#8884d8" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      name="Mike"
                      stroke="#68c58d"
                      strokeWidth={1.5}
                      dot={{ r: 2, fill: "#68c58d" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-white p-5 shadow-md">
              <h2 className="text-lg font-semibold text-zinc-800">
                Expense Breakdown
              </h2>
              <p className="mb-5 text-sm text-zinc-500">
                Lorem ipsum tortor et eu egestas id quam.
              </p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="58%"
                      startAngle={180}
                      endAngle={0}
                      outerRadius="78%"
                      paddingAngle={0}
                      label={false}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={expenseColors[index % expenseColors.length]}
                        />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
