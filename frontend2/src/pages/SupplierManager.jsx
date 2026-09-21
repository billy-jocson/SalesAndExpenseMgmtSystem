import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { Button, InputGroup, Modal, TextField, toast } from "@heroui/react";
import { Magnifier, TrashBin } from "@gravity-ui/icons";
import { useEffect, useState } from "react";
import supplierIcon from "../assets/images/supmanager.png";
import SupplierCard from "../components/SupplierCard.jsx";
import { deleteSupplier, getSuppliers } from "../api/suppliermanager.js";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";

export default function SupplierManager() {
  const [searchSupplier, setSearchSupplier] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierRefreshKey, setSupplierRefreshKey] = useState(0);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const debouncedSearchSupplier = useDebounce(searchSupplier);

  useEffect(() => {
    document.title = "Supplier Manager";
    const loadSuppliers = async () => {
      const data = await getSuppliers(debouncedSearchSupplier);
      const supplierList = Array.isArray(data) ? data : (data?.suppliers ?? []);
      setSuppliers(
        supplierList.map((supplier) => ({
          supplierId: supplier.supplier_id,
          supplierName: supplier.supplier_name,
          contactPerson: supplier.contact_person,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.street_address,
        })),
      );
    };
    loadSuppliers();
  }, [debouncedSearchSupplier, supplierRefreshKey]);

  const handleDelete = async (supplierId) => {
    const response = await deleteSupplier(supplierId);

    if (response?.status?.toLowerCase() !== "success") {
      toast.danger(response?.message ?? "Unable to delete supplier.");
      return;
    }

    toast.success("Supplier deleted successfully.");
    setSupplierRefreshKey((key) => key + 1);
  };

  const closeDeleteConfirmation = () => setSupplierToDelete(null);

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
            <Button variant="primary" className="rounded-lg">
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
                  onEdit={() =>
                    console.log("Edit supplier", supplier.supplierId)
                  }
                  onDelete={() => setSupplierToDelete(supplier)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={Boolean(supplierToDelete)}
        onOpenChange={(open) => {
          if (!open) closeDeleteConfirmation();
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
                <Button variant="tertiary" onPress={closeDeleteConfirmation}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={async () => {
                    const supplierId = supplierToDelete?.supplierId;
                    closeDeleteConfirmation();
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
