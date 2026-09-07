import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useEffect } from "react";
import salesIcon from "../assets/images/reports.png";

export default function Sales() {
  useEffect(() => {
    document.title = "Sales";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />
      <TopBar
        title="Sales"
        body="Track all your sales in this page."
        emoji={salesIcon}
      />
    </div>
  );
}
