import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useEffect, useState } from "react";
import expensesIcon from "../assets/images/salesorexpense.png";
import ExpenseCard from "../components/ExpenseCard.jsx";
import { Magnifier } from "@gravity-ui/icons";
import { useDebounce } from "../hooks/useDebounce.js";
import {
  DateField,
  DateRangePicker,
  // Card,
  InputGroup,
  RangeCalendar,
  TextField,
  Typography,
  // Typography,
} from "@heroui/react";
import AddExpenseModal from "../components/AddExpenseModal.jsx";
import { fetchAllExpenses, fetchCategories } from "../api/expenses";
import NoItemFound from "../components/NoItemFound.jsx";
import { CardGridSkeleton } from "../components/PageSkeleton.jsx";
import CategoryCheckboxDropdown from "../components/CategoryCheckboxDropdown.jsx";

export default function Expenses() {
  const [searchItem, setSearchItem] = useState("");
  const debouncedSearchItem = useDebounce(searchItem);
  const [categories, setCategories] = useState([]);
  const [categorySelected, setCategorySelected] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expensesRefreshKey, setExpensesRefreshKey] = useState(0);

  useEffect(() => {
    document.title = "Expenses";

    const loadCategories = async () => {
      const data = await fetchCategories();
      const categoryList = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
          ? data.categories
          : [];

      setCategories(categoryList);
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadExpenses = async () => {
      setLoading(true);
      try {
        const data = await fetchAllExpenses(
          debouncedSearchItem,
          categorySelected,
          dateRange?.start?.toString() ?? "",
          dateRange?.end?.toString() ?? "",
        );
        setExpenses(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, [debouncedSearchItem, categorySelected, dateRange, expensesRefreshKey]);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 h-full overflow-y-scroll">
          <TopBar
            title="Expenses"
            body="Track and manage your business expenses"
            emoji={expensesIcon}
          />
          <div className="flex w-full flex-col gap-2 xl:flex-row">
            <TextField className="w-full" name="text">
              <InputGroup className="w-full">
                <InputGroup.Prefix>
                  <Magnifier className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  className="w-full"
                  placeholder="Search by category or description"
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                />
              </InputGroup>
            </TextField>

            <div className="flex flex-col gap-2 xl:flex-row">
              <div className="flex gap-3">
                <AddExpenseModal
                  onSuccess={() => setExpensesRefreshKey((key) => key + 1)}
                />
                <CategoryCheckboxDropdown
                  className="w-auto min-w-56 shrink-0"
                  categories={categories}
                  placeholder="Expense category"
                  selectedIds={categorySelected}
                  onSelectionChange={setCategorySelected}
                  clearLabel="All Categories"
                  onClear={() => setCategorySelected([])}
                />
              </div>

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
                  <RangeCalendar aria-label="Choose expense dates">
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
          </div>

          {loading ? (
            <CardGridSkeleton />
          ) : expenses.length === 0 ? (
            <NoItemFound
              title="No expenses found"
              body="There is nothing to show here."
            />
          ) : (
            <>
              <Typography type="body-sm" color="muted">
                {expenses.length} {expenses.length > 1 ? "expenses" : "expense"}{" "}
                found.
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {expenses.map((e, index) => (
                  <ExpenseCard key={index} data={e} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
