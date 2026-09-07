import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useEffect } from "react";
import supplierIcon from "../assets/images/supmanager.png";

export default function SupplierManager() {
  useEffect(() => {
    document.title = "Supplier Manager";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />
      <TopBar
        title="Supplier Manager"
        body="Manage your suppliers here."
        emoji={supplierIcon}
      />
    </div>
  );
}
