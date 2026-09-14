import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useEffect, useState } from "react";
import reports from "../assets/images/reports.png";
import DashboardCards from "../components/DashboardCards.jsx";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Button, Dropdown, Label, Table, Typography } from "@heroui/react";
const expenseData = [
  { name: "Lily", value: 400 },
  { name: "Mike", value: 300 },
  { name: "Matt", value: 220 },
  { name: "Leila", value: 140 },
  { name: "Jack", value: 80 },
];

const expenseColors = ["#8884d8", "#82ca9d", "#ffb82e", "#ff7043", "#168bf0"];

export default function Reports() {
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "name",
    direction: "ascending",
  });
  useEffect(() => {
    document.title = "Reports";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Reports"
            body="Track the status of your business."
            emoji={reports}
          />

          <div className="flex flex-col">
            <div className="flex gap-2 ms-auto">
              <Button variant="primary" className="rounded-lg" onClick={null}>
                Download Reports
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
                  <Dropdown.Menu onAction={(key) => console.log(key)}>
                    <Dropdown.Item id="Today" textValue="Today">
                      <Label>Today</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="This week" textValue="This week">
                      <Label>This Week</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="This month" textValue="This month">
                      <Label>This Month</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <DashboardCards
              title={"Profit Gain"}
              highlighted
              status={20}
              body={"₱15,000"}
            />
            <DashboardCards
              title={"Profit Loss"}
              status={20}
              body={"₱15,000"}
            />
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

          <div className="p-5 rounded-2xl shadow-md">
            <Typography color="default" weight="semibold">
              Top Selling Products
            </Typography>
            <Typography color="muted" type="body-sm">
              Ranked list of products by total revenue generated this month.
            </Typography>

            <Table className="mt-3">
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Users"
                  sortDescriptor={sortDescriptor}
                  onSortChange={setSortDescriptor}
                >
                  <Table.Header>
                    <Table.Column>#</Table.Column>
                    <Table.Column>Product Name</Table.Column>
                    <Table.Column>Units Sold</Table.Column>
                    <Table.Column>Revenue</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell>1</Table.Cell>
                      <Table.Cell>Coke Mismo</Table.Cell>
                      <Table.Cell>150</Table.Cell>
                      <Table.Cell>
                        <Typography
                          type="body-sm"
                          weight="semibold"
                          className="text-blue-500"
                        >
                          ₱15,000
                        </Typography>
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
