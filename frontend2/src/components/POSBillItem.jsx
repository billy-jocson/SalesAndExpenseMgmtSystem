export default function POSBillItem({
  name,
  price,
  quantity,
  image,
  onDecrease,
  onIncrease,
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center gap-3">
        <img
          src={image}
          alt={name}
          className="h-20 w-14 rounded-lg border border-slate-200 object-cover bg-white"
        />

        <div className="min-w-0">
          <h4 className="truncate text-lg font-semibold text-slate-800">
            {name}
          </h4>
          <p className="text-base font-bold text-slate-800">
            ₱{Number(price).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-lg font-medium text-slate-700 transition hover:bg-slate-200"
          aria-label={`Decrease quantity of ${name}`}
        >
          -
        </button>

        <span className="min-w-6 text-center text-lg font-semibold text-slate-800">
          {quantity}
        </span>

        <button
          type="button"
          onClick={onIncrease}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-lg font-medium text-slate-700 transition hover:bg-slate-200"
          aria-label={`Increase quantity of ${name}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
