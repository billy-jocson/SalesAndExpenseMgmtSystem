import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { Button, InputGroup, Modal, TextField, toast } from "@heroui/react";
import { Magnifier, TrashBin } from "@gravity-ui/icons";
import { useEffect, useState } from "react";
import supplierIcon from "../assets/images/supmanager.png";
import SupplierCard from "../components/SupplierCard.jsx";
import { deleteSupplier, getSuppliers, addSupplier, updateSupplier } from "../api/suppliermanager.js";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";

export default function SupplierManager() {
  const [searchSupplier, setSearchSupplier] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierRefreshKey, setSupplierRefreshKey] = useState(0);

  // Modal states
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form input state
  const [formData, setFormData] = useState({
    supplier_name: "",
    contact_person: "",
    email: "",
    phone: "",
    street_address: "",
    postal_code: "4027",
    username: "",
    password: "",
  });

  const debouncedSearchSupplier = useDebounce(searchSupplier);

  useEffect(() => {
    document.title = "Supplier Manager";
    const loadSuppliers = async () => {
      const data = await getSuppliers(debouncedSearchSupplier);
      const supplierList = Array.isArray(data) ? data : (data?.suppliers ?? data?.data ?? []);
      setSuppliers(
        supplierList.map((supplier) => ({
          supplierId: supplier.supplier_id,
          supplierName: supplier.supplier_name,
          contactPerson: supplier.contact_person,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.street_address,
          postalCode: supplier.postal_code,
          username: supplier.username, // <-- DAGDAG TO KAYA BLANK
          userId: supplier.user_id,
        })),
      );
    };
    loadSuppliers();
  }, [debouncedSearchSupplier, supplierRefreshKey]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setFormData({
      supplier_name: "",
      contact_person: "",
      email: "",
      phone: "",
      street_address: "",
      postal_code: "4027",
      username: "",
      password: "",
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setSupplierToEdit(supplier);
    setFormData({
      supplier_id: supplier.supplierId,
      supplier_name: supplier.supplierName,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      street_address: supplier.address,
      postal_code: supplier.postalCode || "4027",
      username: supplier.username || "",
      password: "",
    });
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    let response;

    if (supplierToEdit) {
      // Sa Edit: pag blank password, wag isama para hindi ma-overwrite
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }
      response = await updateSupplier(payload);
    } else {
      // Sa Add: send lahat kasama username/password
      response = await addSupplier(formData);
    }

    if (response?.status?.toLowerCase() !== "success") {
      toast.danger(response?.message ?? "Operation failed.");
      return;
    }

    toast.success(supplierToEdit ? "Supplier updated successfully." : "Supplier added successfully.");
    setIsAddModalOpen(false);
    setSupplierToEdit(null);
    setSupplierRefreshKey((key) => key + 1);
  };

  const handleDelete = async (supplierId) => {
    const response = await deleteSupplier(supplierId);
    if (response?.status?.toLowerCase() !== "success") {
      toast.danger(response?.message ?? "Unable to delete supplier.");
      return;
    }
    toast.success("Supplier deleted successfully.");
    setSupplierRefreshKey((key) => key + 1);
  };

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Supplier Manager"
            body="Manage your suppliers here."
            emoji={supplierIcon}
          />
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <TextField className="w-full" name="supplier-search">
              <InputGroup className="w-full">
                <InputGroup.Prefix>
                  <Magnifier className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  className="w-full"
                  placeholder="Search by supplier name or contact"
                  value={searchSupplier}
                  onChange={(event) => setSearchSupplier(event.target.value)}
                />
              </InputGroup>
            </TextField>
            {/* Connected to openAddModal */}
            <Button variant="primary" className="rounded-lg" onPress={openAddModal}>
              + Add Supplier
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 h-full">
            {suppliers.length === 0 ? (
              <NoItemFound
                title="No supplier found"
                body="There is nothing to show here."
              />
            ) : (
              suppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.supplierId}
                  {...supplier}
                  // Connected to openEditModal
                  onEdit={() => openEditModal(supplier)}
                  onDelete={() => setSupplierToDelete(supplier)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen || Boolean(supplierToEdit)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setSupplierToEdit(null);
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 shadow-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{supplierToEdit ? "Edit Supplier" : "Add New Supplier"}</Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleSaveSupplier}>
                <Modal.Body className="flex flex-col gap-3 py-3">
                  <input
                    type="text"
                    name="supplier_name"
                    placeholder="Supplier Name"
                    value={formData.supplier_name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    name="contact_person"
                    placeholder="Contact Person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    name="street_address"
                    placeholder="Street Address"
                    value={formData.street_address}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    name="postal_code"
                    placeholder="Postal Code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-lg text-sm"
                  />

                  <input
                    type="text"
                    name="username"
                    placeholder="Username * (e.g. colgate_ph)"
                    value={formData.username}
                    onChange={handleChange}
                    required={!supplierToEdit}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder={supplierToEdit ? "New Password (blank to keep)" : "Password *"}
                    value={formData.password}
                    onChange={handleChange}
                    required={!supplierToEdit}
                    className="w-full p-2 border rounded-lg text-sm"
                  />

                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="tertiary"
                    type="button"
                    onPress={() => {
                      setIsAddModalOpen(false);
                      setSupplierToEdit(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    {supplierToEdit ? "Save Changes" : "Add Supplier"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(supplierToDelete)}
        onOpenChange={(open) => {
          if (!open) setSupplierToDelete(null);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-5 shadow-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-red-500 text-white">
                  <TrashBin className="size-5" />
                </Modal.Icon>
                <Modal.Heading>Delete supplier?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm leading-6 text-zinc-600">
                  Are you sure you want to delete{" "}
                  {supplierToDelete?.supplierName} from the database? This
                  cannot be undone.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setSupplierToDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={async () => {
                    const supplierId = supplierToDelete?.supplierId;
                    setSupplierToDelete(null);
                    if (supplierId) await handleDelete(supplierId);
                  }}
                >
                  Confirm
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}