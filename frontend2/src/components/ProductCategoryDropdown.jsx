import { useEffect, useState } from "react";
import { fetchCategories } from "../api/productmanager.js";
import CategoryCheckboxDropdown from "./CategoryCheckboxDropdown.jsx";

export default function ProductCategoryDropdown({
  className = "w-[256px]",
  placeholder = "Product Category",
  selectedIds = [],
  onSelectionChange,
}) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchCategories();

      if (data?.status === "Success") {
        setCategories(data.categories ?? []);
      }
    };

    loadCategories();
  }, []);

  return (
    <CategoryCheckboxDropdown
      categories={categories}
      className={className}
      placeholder={placeholder}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      clearLabel="All Categories"
      onClear={() => onSelectionChange([])}
    />
  );
}
