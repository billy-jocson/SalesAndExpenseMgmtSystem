import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import {
  Autocomplete,
  Button,
  EmptyState,
  Input,
  InputGroup,
  Label,
  ListBox,
  Modal,
  SearchField,
  TextField,
  toast,
  Typography,
  useFilter,
} from "@heroui/react";
import { Magnifier, Person, TrashBin } from "@gravity-ui/icons";
import { useEffect, useState } from "react";
import supplierIcon from "../assets/images/supmanager.png";
import SupplierCard from "../components/SupplierCard.jsx";
import {
  deleteSupplier,
  getSuppliers,
  addSupplier,
  updateSupplier,
  fetchPostalCodes,
  addPostalCode,
} from "../api/suppliermanager.js";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";
import { ListCardSkeleton } from "../components/PageSkeleton.jsx";

export default function SupplierManager() {
  const [searchSupplier, setSearchSupplier] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierRefreshKey, setSupplierRefreshKey] = useState(0);

  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [postalCodes, setPostalCodes] = useState([]);
  const [isPostalCodeModalOpen, setIsPostalCodeModalOpen] = useState(false);
  const [newPostalCodeData, setNewPostalCodeData] = useState({
    postal_code: "",
    city: "",
    state: "",
    country: "",
  });

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

  const { contains } = useFilter({ sensitivity: "base" });
  const debouncedSearchSupplier = useDebounce(searchSupplier);

  useEffect(() => {
    document.title = "Supplier Manager";
    const loadSuppliers = async () => {
      setLoading(true);
      try {
        const data = await getSuppliers(debouncedSearchSupplier);
        const supplierList = Array.isArray(data)
          ? data
          : (data?.suppliers ?? data?.data ?? []);
        setSuppliers(
          supplierList.map((supplier) => ({
            supplierId: supplier.supplier_id,
            supplierName: supplier.supplier_name,
            contactPerson: supplier.contact_person,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.street_address,
            postalCode: supplier.postal_code,
            username: supplier.username,
            userId: supplier.user_id,
          })),
        );
      } finally {
        setLoading(false);
      }
    };
    loadSuppliers();
  }, [debouncedSearchSupplier, supplierRefreshKey]);

  useEffect(() => {
    const loadPostalCodes = async () => {
      const data = await fetchPostalCodes();
      const list = Array.isArray(data)
        ? data
        : (data?.postal_codes ?? data?.data ?? []);
      setPostalCodes(list);
    };

    loadPostalCodes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setFormStep(1);
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
    setFormStep(1);
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

  const validateSupplierDetails = () => {
    if (!formData.supplier_name.trim()) {
      toast.danger("Supplier name is required.");
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.danger("Invalid email format.");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateSupplierDetails()) return;
    setFormStep(2);
  };

  const promptForMissingPostalCode = (value) => {
    const postalCode = value.trim();

    if (
      postalCode.length < 3 ||
      postalCodes.some(
        (item) => item.postal_code.toLowerCase() === postalCode.toLowerCase(),
      )
    ) {
      return;
    }

    setNewPostalCodeData({
      postal_code: postalCode,
      city: "",
      state: "",
      country: "",
    });
    setIsPostalCodeModalOpen(true);
  };

  const handleSavePostalCode = async () => {
    const postalCode = newPostalCodeData.postal_code.trim();
    const city = newPostalCodeData.city.trim();
    const state = newPostalCodeData.state.trim();
    const country = newPostalCodeData.country.trim();

    if (!postalCode || !city || !state || !country) {
      toast.danger("Postal code, city, state, and country are required.");
      return;
    }

    const response = await addPostalCode({
      postal_code: postalCode,
      city,
      state,
      country,
    });

    if (response?.status?.toLowerCase() !== "success") {
      toast.danger(response?.message ?? "Unable to add postal code.");
      return;
    }

    setFormData((prev) => ({ ...prev, postal_code: postalCode }));
    setPostalCodes((prev) => [
      ...prev.filter((item) => item.postal_code !== postalCode),
      { postal_code: postalCode, city, state, country },
    ]);
    setIsPostalCodeModalOpen(false);
    setNewPostalCodeData({ postal_code: "", city: "", state: "", country: "" });
    toast.success("Postal code added successfully.");
  };

  const handleSaveSupplier = async (e) => {
    e?.preventDefault?.();

    if (!formData.supplier_name.trim()) {
      toast.danger("Supplier name is required.");
      return;
    }

    if (!supplierToEdit) {
      if (!formData.username.trim()) {
        toast.danger("Username is required.");
        return;
      }
      if (formData.username.length < 3) {
        toast.danger("Username must be at least 3 characters.");
        return;
      }
      if (!formData.password) {
        toast.danger("Password is required.");
        return;
      }
      if (formData.password.length < 8) {
        toast.danger("Password must be at least 8 characters.");
        return;
      }
    } else {
      if (formData.username && formData.username.trim().length < 3) {
        toast.danger("Username must be at least 3 characters.");
        return;
      }
      if (formData.password && formData.password.length < 8) {
        toast.danger("Password must be at least 8 characters.");
        return;
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.danger("Invalid email format.");
      return;
    }

    let response;

    if (supplierToEdit) {
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }
      response = await updateSupplier(payload);
    } else {
      response = await addSupplier(formData);
    }

    if (response?.status?.toLowerCase() !== "success") {
      toast.danger(response?.message ?? "Operation failed.");
      return;
    }

    toast.success(
      supplierToEdit
        ? "Supplier updated successfully."
        : "Supplier added successfully.",
    );
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
            <Button
              variant="primary"
              className="rounded-lg"
              onPress={openAddModal}
            >
              + Add Supplier
            </Button>
          </div>
          <Typography type="body-sm" color="muted">
            {suppliers.length} {suppliers.length > 1 ? "suppliers" : "supplier"}{" "}
            found.
          </Typography>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 h-full w-full">
            {loading ? (
              <ListCardSkeleton />
            ) : suppliers.length === 0 ? (
              <NoItemFound
                title="No supplier found"
                body="There is nothing to show here."
              />
            ) : (
              suppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.supplierId}
                  {...supplier}
                  onEdit={() => openEditModal(supplier)}
                  onDelete={() => setSupplierToDelete(supplier)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen || Boolean(supplierToEdit)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setSupplierToEdit(null);
            setFormStep(1);
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 shadow-xl">
              <Modal.CloseTrigger />
              <Modal.Header className="flex items-start gap-3">
                <Modal.Icon className="bg-blue-500 text-white">
                  <Person className="size-5" />
                </Modal.Icon>
                <div className="flex flex-col gap-1">
                  <Modal.Heading>
                    {supplierToEdit ? "Edit Supplier" : "Add New Supplier"}
                  </Modal.Heading>
                  <p className="text-sm leading-5 text-zinc-600">
                    {formStep === 1
                      ? "Fill in the supplier details first, then continue to the account setup step."
                      : "Set up the supplier account credentials to finish the profile."}
                  </p>
                </div>
              </Modal.Header>
              <form onSubmit={handleSaveSupplier}>
                <Modal.Body className="flex flex-col gap-3 py-3 overflow-hidden">
                  {formStep === 1 ? (
                    <div className="flex flex-col gap-3">
                      <Label>Supplier Name</Label>
                      <Input
                        type="text"
                        name="supplier_name"
                        placeholder="Enter supplier name"
                        value={formData.supplier_name}
                        onChange={handleChange}
                        className="w-full"
                      />
                      <Label>Contact Person</Label>
                      <Input
                        type="text"
                        name="contact_person"
                        placeholder="Contact Person"
                        value={formData.contact_person}
                        onChange={handleChange}
                        className="w-full"
                      />
                      <Label>Supplier's Email</Label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full"
                      />
                      <Label>Contact Number</Label>
                      <Input
                        type="text"
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full"
                      />
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 flex flex-col gap-3">
                          <Autocomplete
                            className="w-full"
                            placeholder="Select postal code"
                            value={formData.postal_code || null}
                            onChange={(key) => {
                              const selected = postalCodes.find(
                                (item) => item.postal_code === key,
                              );
                              if (selected) {
                                setFormData((prev) => ({
                                  ...prev,
                                  postal_code: selected.postal_code,
                                }));
                              }
                            }}
                          >
                            <Label>Postal Code</Label>
                            <Autocomplete.Trigger>
                              <Autocomplete.Value>
                                {({ defaultChildren }) => {
                                  const selected = postalCodes.find(
                                    (item) =>
                                      item.postal_code === formData.postal_code,
                                  );
                                  return selected
                                    ? `${selected.postal_code} - ${selected.city}, ${selected.state}, ${selected.country}`
                                    : defaultChildren;
                                }}
                              </Autocomplete.Value>
                              <Autocomplete.Indicator />
                            </Autocomplete.Trigger>
                            <Autocomplete.Popover>
                              <Autocomplete.Filter filter={contains}>
                                <SearchField
                                  autoFocus
                                  aria-label="Search postal codes"
                                  name="postal-code-search"
                                  variant="secondary"
                                  onChange={promptForMissingPostalCode}
                                >
                                  <SearchField.Group>
                                    <SearchField.SearchIcon />
                                    <SearchField.Input placeholder="Search postal code, city, state, or country" />
                                    <SearchField.ClearButton />
                                  </SearchField.Group>
                                </SearchField>
                                <ListBox
                                  renderEmptyState={() => (
                                    <EmptyState>
                                      No postal codes found
                                    </EmptyState>
                                  )}
                                >
                                  {postalCodes.map((item) => (
                                    <ListBox.Item
                                      key={item.postal_code}
                                      id={item.postal_code}
                                      textValue={`${item.postal_code} - ${item.city}, ${item.state}, ${item.country}`}
                                    >
                                      {item.postal_code} - {item.city},{" "}
                                      {item.state}, {item.country}
                                      <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Autocomplete.Filter>
                            </Autocomplete.Popover>
                          </Autocomplete>
                        </div>
                        <div className="col-span-12 flex flex-col gap-3">
                          <Label>Street Address</Label>
                          <Input
                            type="text"
                            name="street_address"
                            placeholder="Street Address"
                            value={formData.street_address}
                            onChange={handleChange}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Input
                        type="text"
                        name="username"
                        placeholder="Username * (e.g. colgate_ph)"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full"
                      />
                      <Input
                        type="password"
                        name="password"
                        placeholder={
                          supplierToEdit
                            ? "New Password (blank to keep)"
                            : "Password * (min 8 chars)"
                        }
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full"
                      />
                    </div>
                  )}
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="tertiary"
                    type="button"
                    onPress={() => {
                      setIsAddModalOpen(false);
                      setSupplierToEdit(null);
                      setFormStep(1);
                    }}
                  >
                    Cancel
                  </Button>
                  {formStep === 1 ? (
                    <Button
                      variant="primary"
                      type="button"
                      onPress={handleNextStep}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      type="button"
                      onPress={handleSaveSupplier}
                    >
                      {supplierToEdit ? "Save Changes" : "Add Supplier"}
                    </Button>
                  )}
                  {formStep === 2 && (
                    <Button
                      variant="tertiary"
                      type="button"
                      onPress={() => setFormStep(1)}
                    >
                      Back
                    </Button>
                  )}
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal
        isOpen={isPostalCodeModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsPostalCodeModalOpen(false);
            setNewPostalCodeData({
              postal_code: "",
              city: "",
              state: "",
              country: "",
            });
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-5 shadow-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Add Postal Code</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-3 py-2">
                <Input
                  type="text"
                  value={newPostalCodeData.postal_code}
                  onChange={(event) =>
                    setNewPostalCodeData((prev) => ({
                      ...prev,
                      postal_code: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Postal Code"
                  className="w-full"
                />
                <Input
                  type="text"
                  value={newPostalCodeData.city}
                  onChange={(event) =>
                    setNewPostalCodeData((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }
                  placeholder="City"
                  className="w-full"
                />
                <Input
                  type="text"
                  value={newPostalCodeData.state}
                  onChange={(event) =>
                    setNewPostalCodeData((prev) => ({
                      ...prev,
                      state: event.target.value,
                    }))
                  }
                  placeholder="State"
                  className="w-full"
                />
                <Input
                  type="text"
                  value={newPostalCodeData.country}
                  onChange={(event) =>
                    setNewPostalCodeData((prev) => ({
                      ...prev,
                      country: event.target.value,
                    }))
                  }
                  placeholder="Country"
                  className="w-full"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="tertiary"
                  onPress={() => setIsPostalCodeModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" onPress={handleSavePostalCode}>
                  Save Postal Code
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

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
                <Button
                  variant="tertiary"
                  onPress={() => setSupplierToDelete(null)}
                >
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
