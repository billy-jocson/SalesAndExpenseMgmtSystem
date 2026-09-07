import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useEffect } from "react";
import expensesIcon from "../assets/images/salesorexpense.png";

export default function Expenses() {
  useEffect(() => {
    document.title = "Expenses";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

      <TopBar
        title="Expenses"
        body="Track and manage your business expenses"
        emoji={expensesIcon}
      />
    </div>
  );
}
