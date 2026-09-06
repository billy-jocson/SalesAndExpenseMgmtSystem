import Navbar from "../components/Navbar.jsx";
import { useEffect } from "react";

export default function Dashboard() {
  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  return (
    <div className="box-border h-dvh w-screen overflow-hidden p-4">
      <Navbar />
    </div>
  );
}
