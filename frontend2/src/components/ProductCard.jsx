import { Chip, Button } from "@heroui/react";

export default function ProductCard({
  //   image,
  name,
  category,
  buyprice,
  sellprice,
}) {
  return (
    <article className="flex grow w-auto flex-col max-w-fit overflow-hidden rounded-2xl bg-white p-3.5 shadow-md">
      <div className="flex shadow-inner items-center justify-center overflow-hidden rounded-xl bg-white">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s"
          alt={name}
          className="aspect-square w-full h-full object-contain"
        />
      </div>

      <div className="mt-3 flex min-h-8 items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-base font-semibold text-gray-900">
          {name}
        </h2>
        <Chip size="sm" variant="secondary">
          {category}
        </Chip>
      </div>

      <div className="mt-2 grid grid-cols-2 border-t border-gray-100 pt-2.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Buying price
          </p>
          <p className="text-sm font-semibold text-gray-900">{buyprice}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Selling price
          </p>
          <p className="text-sm font-semibold text-blue-600">{sellprice}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="primary" className="bg-amber-500 w-full rounded-xl">
          Edit
        </Button>
        <Button variant="danger" className="w-full rounded-xl">
          Delete
        </Button>
      </div>
    </article>
  );
}
