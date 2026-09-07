import Navbar from "../components/Navbar.jsx";
import { useEffect } from "react";
import { Typography } from "@heroui/react";

export default function Sales() {
  useEffect(() => {
    document.title = "Sales";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="shadow-md rounded-[1.75rem] w-full p-5 flex flex-col">
        <Typography type="h2">Sales 📃</Typography>
        <Typography color="muted" type="body-sm">
          Track all your sales in this page.
        </Typography>
      </div>
    </div>
  );
}
