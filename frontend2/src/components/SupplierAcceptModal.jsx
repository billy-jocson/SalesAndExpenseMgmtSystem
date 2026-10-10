import { useState, useContext, useEffect } from "react";
import { ChevronsUp, Xmark } from "@gravity-ui/icons";
import { acceptOrder, rejectOrder } from "../api/ordermanager.js";
import { userContext } from "../context/UserContext.js";

export default function SupplierAcceptModal({ order, onSuccess }) {
  const { user } = useContext(userContext);
  const [isOpen, setIsOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order?.order_id) {
      setBatchNumber(`BATCH-${order.order_id}-${Date.now().toString().slice(-6)}`);
    }
  }, [order?.order_id]);

  const handleAccept = async () => {
    if (!expiryDate) {
      alert("Pakiusap, maglagay ng expiry date!");
      return;
    }

    if (new Date(expiryDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
      alert("Hindi maaaring nakaraang petsa ang expiry date!");
      return;
    }

    setLoading(true);
    try {
      const response = await acceptOrder(order.order_id, {
        expiration_date: expiryDate,
        batch_number: batchNumber,
        supplier_user_id: user?.id || user?.user_id,
      });

      if (response?.status?.toLowerCase() === "success") {
        alert(`Order #${order.order_id} tinanggap na! Expiry: ${expiryDate}`);
        setIsOpen(false);
        onSuccess?.();
      } else {
        alert(response?.message ?? "Bigo sa pag-accept ng order.");
      }
    } catch (err) {
      alert(err.message ?? "Nagkaroon ng error sa pag-accept.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const response = await rejectOrder(order.order_id, {
        supplier_user_id: user?.id || user?.user_id,
        reason: "Rejected by supplier",
      });

      if (response?.status?.toLowerCase() === "success") {
        alert(`Order #${order.order_id} ay tinanggihan.`);
        setIsOpen(false);
        onSuccess?.();
      } else {
        alert(response?.message ?? "Bigo sa pag-reject ng order.");
      }
    } catch (err) {
      alert(err.message ?? "Nagkaroon ng error sa pag-reject.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      {/* HeroUI-Styled Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all rounded-xl shadow-sm cursor-pointer"
      >
        <span>✓</span> Accept & Set Expiry
      </button>

      {/* HeroUI Modal Backdrop & Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-[1.75rem] shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden flex flex-col gap-4 p-6 animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center shadow-xs">
                  <ChevronsUp className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    Accept Order #{order?.order_id}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Magtakda ng batch details at shelf life
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="size-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Xmark className="size-4" />
              </button>
            </div>

            {/* Product Summary Box */}
            <div className="p-4 bg-blue-50/70 border border-blue-200/60 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-900">
                  {order?.product_name}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  Qty: {order?.requested_quantity}
                </span>
              </div>
              <p className="text-xs text-blue-600/80">
                Supplier flow: Ikaw ang magtatakda ng tunay na expiry date ng batch.
              </p>
            </div>

            {/* Expiry Date Input Field */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-700">
                Expiry Date (Required) *
              </label>
              <div className="relative w-full">
                <input
                  type="date"
                  min={today}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-800"
                />
              </div>
              <span className="text-[11px] text-gray-400">
                Naka-disable ang mga lumang petsa. Magtakda ng petsa sa hinaharap.
              </span>
            </div>

            {/* Batch Number Input Field */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-700">
                Batch Number
              </label>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Auto-generated"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-100/60 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-800 font-mono text-xs"
                />
              </div>
            </div>

            {/* Notice Box */}
            <div className="p-3.5 bg-green-50/80 border border-green-200/60 rounded-2xl">
              <p className="text-xs text-green-800 leading-relaxed font-medium">
                ✅ Pagka-accept: Awtomatikong papasok sa inventory ang stock at makakatanggap ng notification si Admin.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={loading}
                onClick={handleReject}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-xl transition-all cursor-pointer"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAccept}
                className="px-4 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-95 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? "Pinoproseso..." : "Accept & Notify Admin"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}