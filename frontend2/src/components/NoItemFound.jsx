import notFoundImage from "../assets/images/notfound.svg";

export default function NoItemFound({
  title = "No items found",
  body = "There is nothing to display here.",
}) {
  return (
    <div className="col-span-full my-auto flex min-h-64 w-full flex-col items-center justify-center text-center">
      <img
        src={notFoundImage}
        alt=""
        aria-hidden="true"
        className="mb-5 w-[20%] object-contain"
      />
      <h2 className="text-lg font-semibold text-zinc-800">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{body}</p>
    </div>
  );
}
