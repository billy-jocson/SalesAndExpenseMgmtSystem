import Navbar from "../components/Navbar.jsx";
import { useEffect } from "react";
import { Typography } from "@heroui/react";

export default function SupplierManager() {
  useEffect(() => {
    document.title = "Supplier Manager";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="shadow-md rounded-[1.75rem] w-full p-5 flex flex-col">
        <Typography type="h2">Supplier Manager 📦</Typography>
        <Typography color="muted" type="body-sm">
          Manage your suppliers here.
        </Typography>
      </div>
    </div>
  );
}
