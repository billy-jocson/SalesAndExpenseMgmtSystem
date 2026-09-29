import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import {
  Button,
  InputGroup,
  Modal,
  TextField,
  toast,
  Typography,
} from "@heroui/react";
import { Magnifier, Shield, TrashBin } from "@gravity-ui/icons";
import { useEffect, useState, useContext } from "react";
import roleIcon from "../assets/images/supmanager.png";
import { fetchRoles, addRole, updateRole, deleteRole } from "../api/roles.js";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";
import { ListCardSkeleton } from "../components/PageSkeleton.jsx";
import { userContext } from "../context/UserContext";
import RoleCard from "../components/RoleCard.jsx";

// Simpleng listahan ng mga Pahina para sa UI
const APP_MODULES = [
  {
    id: "Sales",
    label: "Point of Sales & Sales",
    desc: "Access to checkout process and sales history.",
  },
  {
    id: "Inventory",
    label: "Products & Inventory",
    desc: "Manage store products, batches, and restocking.",
  },
  {
    id: "Expenses",
    label: "Expenses",
    desc: "Record and manage operating expenses.",
  },
  {
    id: "Suppliers",
    label: "Supplier Manager",
    desc: "Manage supplier information and contacts.",
  },
  {
    id: "Staff",
    label: "Staff & Roles",
    desc: "Manage system users and role permissions.",
  },
];

export default function RoleManager() {
  const { user } = useContext(userContext);
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");

  const [formData, setFormData] = useState({
    role_id: "",
    role_name: "",
    description: "",
    permissions: {},
  });

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    document.title = "Role Manager";
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchRoles(user?.id);
        if (res?.status === "Error") {
          toast.danger(`Backend Error: ${res.message}`);
          setRoles([]);
        } else {
          const dataArray = Array.isArray(res) ? res : res?.data || [];
          setRoles(dataArray);
        }
      } catch (e) {
        toast?.danger?.(`Failed to load roles ${e}`);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "Administrator") {
      load();
    }
  }, [refreshKey, user]);

  if (user?.role !== "Administrator") {
    return (
      <div className="flex gap-3">
        <Navbar />
        <div className="flex w-full gap-3">
          <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4">
            <NoItemFound
              title="Access Denied"
              body="You must be an Administrator to view and manage roles."
            />
          </div>
        </div>
      </div>
    );
  }

  // Automatic na ipapasa ng React ang buong CRUD grants (Read, Write, Update, Delete) kapag chineck ang module
  const handlePermissionToggle = (moduleId) => {
    setFormData((prev) => {
      const hasAccess = (prev.permissions[moduleId] || []).length > 0;
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleId]: hasAccess ? [] : ["Read", "Write", "Update", "Delete"],
        },
      };
    });
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      role_id: "",
      role_name: "",
      description: "",
      permissions: {},
    });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setModalMode("edit");
    setFormData({
      role_id: role.role_id,
      role_name: role.role_name,
      description: role.description || "",
      permissions: role.permissions || {},
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response =
        modalMode === "add"
          ? await addRole(formData, user?.id)
          : await updateRole(formData, user?.id);
      if (response?.status?.toLowerCase() !== "success") {
        toast.danger(response?.message ?? `Failed to ${modalMode} role`);
        return;
      }
      toast.success(
        `Role ${modalMode === "add" ? "created" : "updated"} successfully.`,
      );
      setIsModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.danger(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteRole(formData.role_id, user?.id);
      if (response?.status?.toLowerCase() !== "success") {
        toast.danger(response?.message ?? "Failed to delete role");
        return;
      }
      toast.success("Role deleted successfully.");
      setIsDeleteOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.danger(err.message);
    }
  };

  const filteredRoles = roles.filter((r) => {
    const name = r.role_name?.toLowerCase() || "";
    const description = r.description?.toLowerCase() || "";
    const searchLower = debouncedSearch.toLowerCase();
    return name.includes(searchLower) || description.includes(searchLower);
  });

  return (
    <div className="flex gap-3">
      <Navbar />
      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Role Manager"
            body="Create roles and assign page access."
            emoji={roleIcon}
          />

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <TextField className="w-full">
              <InputGroup className="w-full">
                <InputGroup.Prefix>
                  <Magnifier className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  placeholder="Search roles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </TextField>
            <Button
              variant="primary"
              className="rounded-lg shrink-0"
              onPress={openAddModal}
            >
              + Create Role
            </Button>
          </div>

          <Typography type="body-sm" color="muted">
            {filteredRoles.length}{" "}
            {filteredRoles.length === 1 ? "role" : "roles"} found.
          </Typography>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 w-full">
            {loading ? (
              <ListCardSkeleton count={3} />
            ) : filteredRoles.length === 0 ? (
              <NoItemFound
                title="No roles found"
                body="Create a role to begin."
              />
            ) : (
              filteredRoles.map((r) => (
                <RoleCard
                  key={r.role_id}
                  role={r}
                  onEdit={openEditModal}
                  onDelete={(role) => {
                    setFormData(role);
                    setIsDeleteOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[min(30rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {modalMode === "add" ? "Create New Role" : "Edit Role"}
                </Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleSave}>
                <Modal.Body className="flex flex-col gap-5 py-4">
                  <TextField className="w-full" isRequired>
                    <label className="text-sm font-semibold mb-1 block">
                      Role Name
                    </label>
                    <InputGroup>
                      <InputGroup.Prefix>
                        <Shield className="size-4 text-muted" />
                      </InputGroup.Prefix>
                      <InputGroup.Input
                        value={formData.role_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            role_name: e.target.value,
                          })
                        }
                        placeholder="e.g. Branch Manager"
                      />
                    </InputGroup>
                  </TextField>
                  <TextField className="w-full">
                    <label className="text-sm font-semibold mb-1 block">
                      Description
                    </label>
                    <InputGroup>
                      <InputGroup.Input
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Role summary"
                      />
                    </InputGroup>
                  </TextField>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">
                      Page Access
                    </h3>
                    <div className="flex flex-col gap-2">
                      {APP_MODULES.map((mod) => {
                        const isChecked =
                          (formData.permissions[mod.id] || []).length > 0;
                        return (
                          <label
                            key={mod.id}
                            className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${isChecked ? "bg-blue-50 border-blue-200" : "hover:bg-slate-50"}`}
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-blue-600 cursor-pointer"
                              checked={isChecked}
                              onChange={() => handlePermissionToggle(mod.id)}
                            />
                            <div>
                              <div className="font-semibold text-sm text-slate-800">
                                {mod.label}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {mod.desc}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="tertiary"
                    onPress={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Save Role
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 shadow-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-red-100 text-red-600">
                  <TrashBin className="w-5 h-5" />
                </Modal.Icon>
                <Modal.Heading>Delete Role</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="py-2 text-sm text-zinc-600">
                Are you sure you want to delete the role{" "}
                <strong>{formData.role_name}</strong>? This action cannot be
                undone.
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2 mt-4">
                <Button
                  variant="tertiary"
                  onPress={() => setIsDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="danger" onPress={handleDelete}>
                  Delete Role
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
