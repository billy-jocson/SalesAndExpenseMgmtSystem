import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useEffect, useState } from "react";
import salesIcon from "../assets/images/salesorexpense.png";
import SaleCard from "../components/SaleCard.jsx";
import {
  DateField,
  DateRangePicker,
  InputGroup,
  RangeCalendar,
  TextField,
} from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";
import { useDebounce } from "../hooks/useDebounce.js";
import { getSales } from "../api/sales.js";
import NoItemFound from "../components/NoItemFound.jsx";
import { ListCardSkeleton } from "../components/PageSkeleton.jsx";

export default function Sales() {
  const [searchItem, setSearchItem] = useState("");
  const debouncedSearchItem = useDebounce(searchItem);
  const [dateRange, setDateRange] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    document.title = "Sales";
  }, []);

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      try {
        const data = await getSales(
          debouncedSearchItem,
          dateRange?.start?.toString() ?? "",
          dateRange?.end?.toString() ?? "",
        );
        setSales(data);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, [debouncedSearchItem, dateRange]);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Sales"
            body="Track all your sales in this page."
            emoji={salesIcon}
          />
          <div className="flex flex-col lg:flex-row gap-2 w-full">
            <TextField className="w-full" name="text">
              <InputGroup className="w-full">
                <InputGroup.Prefix>
                  <Magnifier className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  className="w-full"
                  placeholder="Search by transaction id, staff, or date"
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                />
              </InputGroup>
            </TextField>
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
                <RangeCalendar aria-label="Choose sale dates">
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
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {loading ? (
              <ListCardSkeleton />
            ) : sales.length === 0 ? (
              <NoItemFound
                title="No sales found"
                body="There is nothing to show here."
              />
            ) : (
              sales.map((sale, index) => (
                <SaleCard
                  key={sale.sale_id ?? sale.transaction_id ?? index}
                  data={sale}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
