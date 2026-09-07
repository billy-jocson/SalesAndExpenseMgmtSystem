import Navbar from "../components/Navbar.jsx";
import { Typography } from "@heroui/react";
import { useEffect } from "react";

export default function Dashboard() {
  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="shadow-md rounded-[1.75rem] w-full p-5 flex flex-col">
        <Typography type="h2">Dashboard 🏠</Typography>
        <Typography color="muted" type="body-sm">
          See what’s happening with your business.
        </Typography>
      </div>
    </div>
  );
}
