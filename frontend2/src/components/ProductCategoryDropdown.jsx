import { ListBox, Select } from "@heroui/react";
import { useEffect, useState } from "react";
import { fetchCategories } from "../api/productmanager.js";

export default function ProductCategoryDropdown({
  className = "w-[256px]",
  placeholder = "Product Category",
  selectedKey,
  onSelectionChange,
}) {
  const [categories, setCategories] = useState([
    { id: "all", name: "All Categories" },
  ]);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchCategories();

      if (data?.status === "Success") {
        setCategories([
          { id: "all", name: "All Categories" },
          ...(data.categories ?? []).map((category) => ({
            id: String(category.category_id),
            name: category.category_name,
          })),
        ]);
      }
    };

    loadCategories();
  }, []);

  return (
    <Select
      className={className}
      placeholder={placeholder}
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {categories.map((category) => (
            <ListBox.Item
              key={category.id}
              id={category.id}
              textValue={category.name}
            >
              {category.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
