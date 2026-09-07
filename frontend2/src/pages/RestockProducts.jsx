import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useEffect } from "react";
import restockIcon from "../assets/images/restockprod.png";

export default function RestockProducts() {
  useEffect(() => {
    document.title = "Restock Products";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />
      <TopBar
        title="Restock Products"
        body="Replenish your stocks before they run out."
        emoji={restockIcon}
      />
    </div>
  );
}
