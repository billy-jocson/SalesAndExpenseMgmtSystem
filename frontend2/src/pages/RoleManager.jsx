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
import { useEffect, useState } from "react";
import roleIcon from "../assets/images/supmanager.png";
import { fetchRoles, addRole, updateRole, deleteRole } from "../api/roles.js";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";
import { ListCardSkeleton } from "../components/PageSkeleton.jsx";
import useAuth from "../hooks/useAuth";
import RoleCard from "../components/RoleCard.jsx";

export default function RoleManager() {
  const { user, hasPermission } = useAuth();
  const canReadRoles = hasPermission("read_staffs");
  const canCreateRoles = hasPermission("write_staffs");
  const canUpdateRoles = hasPermission("update_staffs");
  const canDeleteRoles = hasPermission("delete_staffs");
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");

  const [formData, setFormData] = useState({
    role_id: "",
    role_name: "",
    description: "",
    permission_ids: [],
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
          setAvailablePermissions(res?.permissions ?? []);
        }
      } catch (e) {
        toast?.danger?.(`Failed to load roles ${e}`);
      } finally {
        setLoading(false);
      }
    };

    if (canReadRoles) {
      load();
    }
  }, [canReadRoles, refreshKey, user?.id]);

  if (!canReadRoles) {
    return (
      <div className="flex gap-3">
        <Navbar />
        <div className="flex w-full gap-3">
          <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4">
            <NoItemFound
              title="Access Denied"
              body="You don't have permission to view roles."
            />
          </div>
        </div>
      </div>
    );
  }

  const handlePermissionToggle = (permissionId) => {
    setFormData((prev) => {
      return {
        ...prev,
        permission_ids: prev.permission_ids.includes(permissionId)
          ? prev.permission_ids.filter((id) => id !== permissionId)
          : [...prev.permission_ids, permissionId],
      };
    });
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      role_id: "",
      role_name: "",
      description: "",
      permission_ids: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setModalMode("edit");
    setFormData({
      role_id: role.role_id,
      role_name: role.role_name,
      description: role.description || "",
      permission_ids: role.permission_ids || [],
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (modalMode === "add" ? !canCreateRoles : !canUpdateRoles) {
      toast.danger("You don't have permission to save role changes.");
      return;
    }

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
    if (!canDeleteRoles) {
      toast.danger("You don't have permission to delete roles.");
      return;
    }

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
  const permissionsByModule = availablePermissions.reduce((groups, permission) => {
    const module = permission.module || "Other";
    groups[module] ??= [];
    groups[module].push(permission);
    return groups;
  }, {});

  return (
    <div className="flex gap-3">
      <Navbar />
      <div className="flex w-full gap-3">
        <div className="bg-white flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4 max-h-[calc(100dvh-2rem)] overflow-y-scroll scrollbar-thin">
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
            {canCreateRoles && <Button
              size="sm"
              variant="primary"
              className="rounded-lg shrink-0"
              onPress={openAddModal}
            >
              Add Role
            </Button>}
          </div>

          <Typography type="body-sm" color="muted">
            {filteredRoles.length}{" "}
            {filteredRoles.length === 1 ? "role" : "roles"} found.
          </Typography>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3 w-full">
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
                  currentUserRole={user?.role}
                  onEdit={openEditModal}
                  onDelete={(role) => {
                    setFormData(role);
                    setIsDeleteOpen(true);
                  }}
                  canEdit={canUpdateRoles}
                  canDelete={canDeleteRoles}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="w-[min(30rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin">
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
                      Permissions
                    </h3>
                    <div className="flex flex-col gap-2">
                      {Object.entries(permissionsByModule).map(
                        ([module, modulePermissions]) => (
                          <fieldset
                            key={module}
                            className="rounded-xl border p-3"
                          >
                            <legend className="px-1 text-sm font-semibold text-slate-800">
                              {module}
                            </legend>
                            <div className="flex flex-col gap-2">
                              {modulePermissions.map((permission) => {
                                const permissionId = Number(
                                  permission.permission_id,
                                );
                                const isChecked =
                                  formData.permission_ids.includes(
                                    permissionId,
                                  );
                                const label = permission.permission_name
                                  .replaceAll("_", " ")
                                  .replace(/\b\w/g, (letter) =>
                                    letter.toUpperCase(),
                                  );

                                return (
                                  <label
                                    key={permissionId}
                                    className={`flex items-start gap-3 rounded-lg p-2 cursor-pointer transition-colors ${isChecked ? "bg-blue-50" : "hover:bg-slate-50"}`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-1 size-4 accent-blue-600"
                                      checked={isChecked}
                                      onChange={() =>
                                        handlePermissionToggle(permissionId)
                                      }
                                    />
                                    <span>
                                      <span className="block text-sm font-medium text-slate-800">
                                        {label}
                                      </span>
                                      {permission.description && (
                                        <span className="mt-0.5 block text-xs text-slate-500">
                                          {permission.description}
                                        </span>
                                      )}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </fieldset>
                        ),
                      )}
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
                  {((modalMode === "add" && canCreateRoles) ||
                    (modalMode === "edit" && canUpdateRoles)) && (
                    <Button variant="primary" type="submit">
                      Save Role
                    </Button>
                  )}
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
                {canDeleteRoles && (
                  <Button variant="danger" onPress={handleDelete}>
                    Delete Role
                  </Button>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}