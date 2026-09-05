import { Routes, Route } from "react-router-dom";

export default function Navbar() {
  return (
    <Routes>
      <Route path="/dashboard" element={null} />
      <Route path="/pos" element={null} />
      <Route path="/sales" element={null} />
      <Route path="/expenses" element={null} />
      <Route path="/productsmanager" element={null} />
      <Route path="/suppliermanager" element={null} />
      <Route path="/restockproducts" element={null} />
    </Routes>
  );
}
