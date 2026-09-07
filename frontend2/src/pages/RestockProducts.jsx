import Navbar from "../components/Navbar.jsx";
import { useEffect } from "react";
import { Typography } from "@heroui/react";

export default function RestockProducts() {
  useEffect(() => {
    document.title = "Restock Products";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="shadow-md rounded-[1.75rem] w-full p-5 flex flex-col">
        <Typography type="h2">Restock Products 📦</Typography>
        <Typography color="muted" type="body-sm">
          Replenish your stocks before they run out.
        </Typography>
      </div>
    </div>
  );
}
