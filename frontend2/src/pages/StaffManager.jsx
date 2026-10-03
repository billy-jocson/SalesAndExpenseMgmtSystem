import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  FieldError,
  InputGroup,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  toast,
  Typography,
} from "@heroui/react";
import {
  Envelope,
  Magnifier,
  Person,
  PersonFill,
  Smartphone,
  TrashBin,
} from "@gravity-ui/icons";
import { useContext, useEffect, useState } from "react";
import { parseDate } from "@internationalized/date";
import staffIcon from "../assets/images/supmanager.png";
import {
  fetchStaffs,
  addStaff,
  updateStaff,
  getStaffRoles,
  deleteStaff,
} from "../api/staffmanager.js";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";
import { ListCardSkeleton } from "../components/PageSkeleton.jsx";
import { userContext } from "../context/UserContext";

const getTodayDate = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
};

const createStaffForm = () => ({
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  phone: "",
  hire_date: getTodayDate(),
  username: "",
  password: "",
  role_name: "",
});

function StaffCard({ staff, onDelete, onEdit }) {
  const initials =
    `${staff.first_name?.charAt(0) ?? ""}${staff.last_name?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <div className="h-fit p-4 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col gap-1">
      <div className="flex gap-4 items-start mb-3">
        <div className="h-12 w-12 rounded-full bg-foreground text-white flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[0.95rem] truncate">
            {staff.first_name} {staff.middle_name} {staff.last_name}
          </p>
          <p className="text-xs text-zinc-500">
            @{staff.username} • {staff.role_name}
          </p>
          <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-600">
            {staff.email && (
              <span className="flex gap-1">
                <Envelope /> {staff.email}
              </span>
            )}
            {staff.phone && (
              <span className="flex gap-1">
                <Smartphone /> {staff.phone}
              </span>
            )}
            {staff.hire_date && (
              <span className="flex gap-1">
                <PersonFill /> Hired: {staff.hire_date}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-1 justify-end mt-auto">
        <Button className="bg-amber-500" onPress={() => onEdit(staff)}>
          Edit
        </Button>
        <Button variant="danger" onPress={() => onDelete(staff)}>
          Delete
        </Button>
      </div>
    </div>
  );
}

export default function StaffManager() {
  const user = useContext(userContext);
  const [search, setSearch] = useState("");
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState(createStaffForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    document.title = "Staff Manager";
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchStaffs(debouncedSearch);
        res.data.filter((staff) => staff.user_id != user?.id);

        setStaffs(res.data || []);
      } catch (e) {
        console.error(e);
        toast?.danger?.("Failed to load staffs");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [debouncedSearch, refreshKey, user?.id]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await getStaffRoles();
        setRoles(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.first_name.trim())
      errors.first_name = "First name is required.";
    if (!formData.last_name.trim()) errors.last_name = "Last name is required.";
    if (!formData.username.trim()) errors.username = "Username is required.";
    if (!editingStaff && !formData.password) {
      errors.password = "Password is required.";
    }
    if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!formData.role_name) errors.role_name = "Select a role.";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const response = editingStaff
        ? await updateStaff(editingStaff.staff_id, formData)
        : await addStaff(formData);
      if (
        response?.status?.toLowerCase() !== "success" &&
        response?.status !== "Success"
      ) {
        toast.danger(response?.message ?? "Failed to save staff");
        return;
      }
      toast.success(
        editingStaff
          ? "Staff updated successfully."
          : "Staff added successfully.",
      );
      setIsAddOpen(false);
      setEditingStaff(null);
      setFormData(createStaffForm());
      setFormErrors({});
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.danger(err.message);
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      const response = await deleteStaff(staffToDelete.staff_id);

      if (response?.status !== "Success") {
        toast.danger(response?.message ?? "Failed to delete staff");
        return;
      }

      toast.success("Staff deleted successfully.");
      setStaffToDelete(null);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      toast.danger(error.message);
    }
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setFormErrors({});

    setFormData({
      first_name: staff.first_name ?? "",
      middle_name: staff.middle_name ?? "",
      last_name: staff.last_name ?? "",
      email: staff.email ?? "",
      phone: staff.phone ?? "",
      hire_date: staff.hire_date ?? "",
      username: staff.username ?? "",
      password: "",
      role_name: staff.role_name ?? "",
    });

    setIsAddOpen(true);
  };

  return (
    <div className="flex gap-3">
      <Navbar />
      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Staff Manager"
            body="Create and view staff accounts"
            emoji={staffIcon}
          />

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <TextField className="w-full" name="staff-search">
              <InputGroup className="w-full">
                <InputGroup.Prefix>
                  <Magnifier className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  className="w-full"
                  placeholder="Search by name, username, email, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </TextField>
            <Button
              variant="primary"
              className="rounded-lg"
              onPress={() => {
                setEditingStaff(null);
                setFormData(createStaffForm());
                setFormErrors({});
                setIsAddOpen(true);
              }}
            >
              + Add Staff
            </Button>
          </div>

          <Typography type="body-sm" color="muted">
            {staffs.length} {staffs.length > 1 ? "staffs" : "staff"} found.
          </Typography>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 w-full h-full">
            {loading ? (
              <ListCardSkeleton />
            ) : staffs.length === 0 ? (
              <NoItemFound
                title="No staff found"
                body="Add your first staff account."
              />
            ) : (
              staffs.map((s) => (
                <StaffCard
                  key={s.staff_id}
                  staff={s}
                  onDelete={setStaffToDelete}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddOpen}
        onOpenChange={(open) => {
          if (!open) setIsAddOpen(false);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="rounded-2xl bg-white p-6 shadow-xl">
              <Modal.CloseTrigger />
              <Modal.Header className="flex items-start gap-3">
                <Modal.Icon className="bg-blue-500 text-white">
                  <Person className="size-5" />
                </Modal.Icon>
                <Modal.Heading>
                  {editingStaff ? "Edit Staff" : "Add New Staff"}
                </Modal.Heading>
              </Modal.Header>
              <form noValidate onSubmit={handleSave}>
                <Modal.Body className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
                  <TextField
                    name="first_name"
                    isInvalid={Boolean(formErrors.first_name)}
                    className="flex flex-col gap-1"
                  >
                    <Label htmlFor="staff-first-name">First Name *</Label>
                    <Input
                      id="staff-first-name"
                      name="first_name"
                      type="text"
                      placeholder="Enter first name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full"
                    />
                    <FieldError>{formErrors.first_name}</FieldError>
                  </TextField>
                  <TextField name="middle_name" className="flex flex-col gap-1">
                    <Label htmlFor="staff-middle-name">Middle Name</Label>
                    <Input
                      id="staff-middle-name"
                      name="middle_name"
                      type="text"
                      placeholder="Enter middle name (optional)"
                      value={formData.middle_name}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </TextField>
                  <TextField
                    name="last_name"
                    isInvalid={Boolean(formErrors.last_name)}
                    className="flex flex-col gap-1"
                  >
                    <Label htmlFor="staff-last-name">Last Name *</Label>
                    <Input
                      id="staff-last-name"
                      name="last_name"
                      type="text"
                      placeholder="Enter last name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full"
                    />
                    <FieldError>{formErrors.last_name}</FieldError>
                  </TextField>
                  <TextField
                    name="email"
                    isInvalid={Boolean(formErrors.email)}
                    className="flex flex-col gap-1"
                  >
                    <Label htmlFor="staff-email">Email</Label>
                    <Input
                      id="staff-email"
                      name="email"
                      type="email"
                      placeholder="name@example.com (optional)"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full"
                    />
                    <FieldError>{formErrors.email}</FieldError>
                  </TextField>
                  <TextField name="phone" className="flex flex-col gap-1">
                    <Label htmlFor="staff-phone">Phone</Label>
                    <Input
                      id="staff-phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter contact number (optional)"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </TextField>
                  {editingStaff && (
                    <DatePicker
                      className="w-full"
                      name="hire_date"
                      value={
                        formData.hire_date
                          ? parseDate(formData.hire_date.slice(0, 10))
                          : null
                      }
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          hire_date: date?.toString() ?? "",
                        }))
                      }
                    >
                      <Label>Hire Date</Label>
                      <DateField.Group fullWidth>
                        <DateField.Input>
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                        <DateField.Suffix>
                          <DatePicker.Trigger>
                            <DatePicker.TriggerIndicator />
                          </DatePicker.Trigger>
                        </DateField.Suffix>
                      </DateField.Group>
                      <DatePicker.Popover>
                        <Calendar aria-label="Hire date">
                          <Calendar.Header>
                            <Calendar.YearPickerTrigger>
                              <Calendar.YearPickerTriggerHeading />
                              <Calendar.YearPickerTriggerIndicator />
                            </Calendar.YearPickerTrigger>
                            <Calendar.NavButton slot="previous" />
                            <Calendar.NavButton slot="next" />
                          </Calendar.Header>
                          <Calendar.Grid>
                            <Calendar.GridHeader>
                              {(day) => (
                                <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                              )}
                            </Calendar.GridHeader>
                            <Calendar.GridBody>
                              {(date) => <Calendar.Cell date={date} />}
                            </Calendar.GridBody>
                          </Calendar.Grid>
                          <Calendar.YearPickerGrid>
                            <Calendar.YearPickerGridBody>
                              {({ year }) => (
                                <Calendar.YearPickerCell year={year} />
                              )}
                            </Calendar.YearPickerGridBody>
                          </Calendar.YearPickerGrid>
                        </Calendar>
                      </DatePicker.Popover>
                    </DatePicker>
                  )}
                  <TextField
                    name="username"
                    isInvalid={Boolean(formErrors.username)}
                    className="flex flex-col gap-1"
                  >
                    <Label htmlFor="staff-username">Username *</Label>
                    <Input
                      id="staff-username"
                      name="username"
                      type="text"
                      placeholder="Choose a sign-in username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full"
                    />
                    <FieldError>{formErrors.username}</FieldError>
                  </TextField>
                  <TextField
                    name="password"
                    isInvalid={Boolean(formErrors.password)}
                    className="flex flex-col gap-1"
                  >
                    <Label htmlFor="staff-password">
                      {editingStaff ? "New Password" : "Password *"}
                    </Label>
                    <Input
                      id="staff-password"
                      name="password"
                      type="password"
                      placeholder={
                        editingStaff
                          ? "Leave blank to keep the current password"
                          : "Create a password (8+ characters)"
                      }
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full"
                    />
                    <FieldError>{formErrors.password}</FieldError>
                  </TextField>
                  <TextField
                    name="role_name"
                    isInvalid={Boolean(formErrors.role_name)}
                    className="flex flex-col gap-1 sm:col-span-2"
                  >
                    <Label>Role *</Label>
                    <Select
                      className="w-full"
                      placeholder="Choose a staff role"
                      selectedKey={formData.role_name || null}
                      onSelectionChange={(key) => {
                        setFormData((prev) => ({
                          ...prev,
                          role_name: key == null ? "" : String(key),
                        }));
                        setFormErrors((prev) => ({ ...prev, role_name: "" }));
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {roles.map((role) => (
                            <ListBox.Item
                              key={role.role_id}
                              id={role.role_name}
                              textValue={role.role_name}
                            >
                              {role.role_name}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <FieldError>{formErrors.role_name}</FieldError>
                  </TextField>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="tertiary"
                    type="button"
                    onPress={() => setIsAddOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    {editingStaff ? "Save Changes" : "Create Staff"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal
        isOpen={Boolean(staffToDelete)}
        onOpenChange={(open) => {
          if (!open) setStaffToDelete(null);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 shadow-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-red-100 text-red-600">
                  <TrashBin className="size-5" />
                </Modal.Icon>
                <Modal.Heading>Delete Staff</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="text-sm text-zinc-600">
                Delete {staffToDelete?.first_name} {staffToDelete?.last_name}?
                This action cannot be undone.
              </Modal.Body>
              <Modal.Footer className="mt-4 flex justify-end gap-2">
                <Button
                  variant="tertiary"
                  onPress={() => setStaffToDelete(null)}
                >
                  Cancel
                </Button>
                <Button variant="danger" onPress={handleDelete}>
                  Delete Staff
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
