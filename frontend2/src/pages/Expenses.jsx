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
  ListBox,
  RangeCalendar,
  Select,
  TextField,
  // Typography,
} from "@heroui/react";
import AddExpenseModal from "../components/AddExpenseModal.jsx";
import { fetchAllExpenses, fetchCategories } from "../api/expenses";
import NoItemFound from "../components/NoItemFound.jsx";

export default function Expenses() {
  const [searchItem, setSearchItem] = useState("");
  const debouncedSearchItem = useDebounce(searchItem);
  const [categories, setCategories] = useState([]);
  const [categorySelected, setCategorySelected] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [expenses, setExpenses] = useState([]);
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
      const data = await fetchAllExpenses(
        debouncedSearchItem,
        categorySelected,
        dateRange?.start?.toString() ?? "",
        dateRange?.end?.toString() ?? "",
      );
      setExpenses(Array.isArray(data) ? data : []);
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
                <Select
                  className="w-auto shrink-0"
                  placeholder="Expense category"
                  selectedKey={categorySelected || undefined}
                  onSelectionChange={(key) => {
                    setCategorySelected(key === "all" ? "" : String(key));
                  }}
                >
                  <Select.Trigger className="whitespace-nowrap">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item
                        id="all"
                        key="all"
                        textValue="All Categories"
                      >
                        All Categories
                        {!categorySelected && <ListBox.ItemIndicator />}
                      </ListBox.Item>
                      {categories.length === 0 ? (
                        <ListBox.Item
                          isDisabled
                          id="empty"
                          key="empty"
                          textValue="No categories yet"
                        >
                          No categories yet
                        </ListBox.Item>
                      ) : (
                        categories.map((category) => (
                          <ListBox.Item
                            id={String(category.category_id)}
                            key={category.category_id}
                            textValue={String(category.category_name)}
                          >
                            {category.category_name}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))
                      )}
                    </ListBox>
                  </Select.Popover>
                </Select>
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

          {expenses.length === 0 ? (
            <NoItemFound
              title="No expenses found"
              body="There is nothing to show here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expenses.map((e, index) => (
                <ExpenseCard key={index} data={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
