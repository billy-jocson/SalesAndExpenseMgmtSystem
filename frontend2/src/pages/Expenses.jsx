import Navbar from "../components/Navbar.jsx";
import { Typography } from "@heroui/react";
import { useEffect } from "react";

export default function Expenses() {
  useEffect(() => {
    document.title = "Expenses";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="shadow-md rounded-[1.75rem] w-full p-5 flex flex-col">
        <Typography type="h2">Expenses 📃</Typography>
        <Typography color="muted" type="body-sm">
          Track all your expenses in this page.
        </Typography>
      </div>
    </div>
  );
}
