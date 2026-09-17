import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { Button, InputGroup, Modal, TextField, toast } from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";
import { useEffect, useState } from "react";
import staffIcon from "../assets/images/supmanager.png"; 
import { fetchStaffs, addStaff, getStaffRoles } from "../api/staffmanager.js";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";

function StaffCard({ staff }) {
  const initials = `${staff.first_name?.charAt(0) ?? ""}${staff.last_name?.charAt(0) ?? ""}`.toUpperCase();
  return (
    <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-all flex gap-4 items-start">
      <div className="h-12 w-12 rounded-full bg-[#3f5fb2] text-white flex items-center justify-center font-bold text-sm shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[0.95rem] truncate">
          {staff.first_name} {staff.middle_name} {staff.last_name}
        </p>
        <p className="text-xs text-zinc-500">@{staff.username} • {staff.role_name}</p>
        <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-600">
          {staff.email && <span>📧 {staff.email}</span>}
          {staff.phone && <span>📱 {staff.phone}</span>}
          {staff.hire_date && <span>📅 Hired: {staff.hire_date}</span>}
        </div>
      </div>
      <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
    </div>
  );
}

export default function StaffManager() {
  const [search, setSearch] = useState("");
  const [staffs, setStaffs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    hire_date: "",
    username: "",
    password: "",
    role_name: ""
  });

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    document.title = "Staff Manager";
    const load = async () => {
      try {
        const res = await fetchStaffs(debouncedSearch);
        setStaffs(res.data || []);
      } catch (e) {
        console.error(e);
        toast?.danger?.("Failed to load staffs");
      }
    };
    load();
  }, [debouncedSearch, refreshKey]);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await addStaff(formData);
      if (response?.status?.toLowerCase() !== "success" && response?.status !== "Success") {
        toast.danger(response?.message ?? "Failed to add staff");
        return;
      }
      toast.success("Staff added successfully.");
      setIsAddOpen(false);
      setFormData({
        first_name: "", middle_name: "", last_name: "", email: "", phone: "",
        hire_date: "", username: "", password: "", role_name: ""
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.danger(err.message);
    }
  };

  return (
    <div className="flex gap-3">
      <Navbar />
      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Staff Manager"
            body="Create and view staff accounts - Assigned: Create + Read"
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
            <Button variant="primary" className="rounded-lg" onPress={() => setIsAddOpen(true)}>
              + Add Staff
            </Button>
          </div>

          <p className="text-xs text-zinc-500">{staffs.length} staff(s) found</p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 h-full">
            {staffs.length === 0 ? (
              <NoItemFound title="No staff found" body="Add your first staff account." />
            ) : (
              staffs.map((s) => <StaffCard key={s.staff_id} staff={s} />)
            )}
          </div>
        </div>
      </div>

      
      <Modal isOpen={isAddOpen} onOpenChange={(open) => { if (!open) setIsAddOpen(false); }}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 shadow-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Add New Staff</Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleSave}>
                <Modal.Body className="flex flex-col gap-3 py-3">
                  <input name="first_name" placeholder="First Name *" value={formData.first_name} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                  <input name="middle_name" placeholder="Middle Name" value={formData.middle_name} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
                  <input name="last_name" placeholder="Last Name *" value={formData.last_name} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                  <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
                  <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
                  <input name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
                  <input name="username" placeholder="Username *" value={formData.username} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                  <input name="password" type="password" placeholder="Password *" value={formData.password} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm" />
                  
                  
                  <select name="role_name" value={formData.role_name} onChange={handleChange} required className="w-full p-2 border rounded-lg text-sm bg-white">
                    <option value="">Select Role *</option>
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_name}>{r.role_name}</option>
                    ))}
                  </select>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2 mt-4">
                  <Button variant="tertiary" type="button" onPress={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Create Staff</Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
