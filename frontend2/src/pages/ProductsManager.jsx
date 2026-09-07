import Navbar from "../components/Navbar.jsx";
import { useEffect } from "react";
import { Typography } from "@heroui/react";

export default function ProductsManager() {
  useEffect(() => {
    document.title = "Products Manager";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="shadow-md rounded-[1.75rem] w-full p-5 flex flex-col">
        <Typography type="h2">Products Manager 🛍️</Typography>
        <Typography color="muted" type="body-sm">
          Manage your products here.
        </Typography>
      </div>
    </div>
  );
}
