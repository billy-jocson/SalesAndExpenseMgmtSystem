import Navbar from "../components/Navbar";
import { Typography } from "@heroui/react";

export default function POS() {
  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="shadow-md rounded-[1.75rem] w-full p-5 flex flex-col">
        <Typography type="h2">Point of Sale 🧾</Typography>
        <Typography color="muted" type="body-sm">
          Create a transaction here.
        </Typography>
      </div>
    </div>
  );
}
