export default function CategoryCheckboxDropdown({
  categories = [],
  selectedIds = [],
  onSelectionChange,
  placeholder = "Select categories",
  className = "w-full",
  clearLabel,
  onClear,
}) {
  const selectedNames = categories
    .filter((category) => selectedIds.includes(String(category.category_id)))
    .map((category) => category.category_name);

  return (
    <details className={`group relative ${className}`}>
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-xl bg-gray-50 px-3 text-sm text-gray-700 shadow-sm marker:hidden">
        <span className="truncate">
          {selectedNames.length > 0 ? selectedNames.join(", ") : placeholder}
        </span>
        <span aria-hidden="true" className="ml-2 text-gray-500">
          ▾
        </span>
      </summary>
      <div className="absolute left-0 top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
        {clearLabel && (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedIds.length === 0}
              onChange={onClear}
              className="size-4 accent-blue-600"
            />
            <span>{clearLabel}</span>
          </label>
        )}
        {categories.map((category) => {
          const categoryId = String(category.category_id);
          const checked = selectedIds.includes(categoryId);

          return (
            <label
              key={categoryId}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onSelectionChange(
                    checked
                      ? selectedIds.filter((id) => id !== categoryId)
                      : [...selectedIds, categoryId],
                  )
                }
                className="size-4 accent-blue-600"
              />
              <span>{category.category_name}</span>
            </label>
          );
        })}
      </div>
    </details>
  );
}
