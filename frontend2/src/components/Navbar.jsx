import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import CalculaLogo from "../assets/Logo_light.svg";
import { NavRoutes } from "../NavRoutes";
import {
  AlertDialog,
  Accordion,
  Avatar,
  Button,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDialog,
  DrawerRoot,
  DrawerTrigger,
} from "@heroui/react";
import { useCookies } from "react-cookie";
import { useContext } from "react";
import { userContext } from "../context/UserContext";
import {
  LayoutCellsLarge,
  Calculator,
  ShoppingBasket,
  BookOpen,
  Receipt,
  PersonWorker,
  ArrowChevronUp,
  ChevronDown,
  ArrowRightFromSquare,
  Bars,
  ChartMixed,
  Xmark,
  Person,
  Shield,
} from "@gravity-ui/icons";

function SidebarContent({ menuItems, location, onNavigate, user, initials }) {
  const [, , removeCookie] = useCookies(["username"]);
  const { logout } = useContext(userContext);
  const [openGroup, setOpenGroup] = useState(() => {
    return (
      menuItems.find(({ children }) =>
        children?.some(({ path }) => location.pathname === path),
      )?.label ?? null
    );
  });

  return (
    <>
      <div className="overflow-y-auto">
        <Link
          to={NavRoutes.DASHBOARD}
          onClick={onNavigate}
          aria-label="Calcula dashboard"
          className="shrink-0"
        >
          <img src={CalculaLogo} alt="Calcula" className="w-32" />
        </Link>

        <div className="mt-10 flex min-h-0 flex-1 flex-col">
          <p className="mb-3 text-[0.7rem] font-bold uppercase text-zinc-500">
            Menu
          </p>
          <nav
            className="flex min-h-0 flex-col gap-2 overflow-y-auto"
            aria-label="Main navigation"
          >
            {menuItems
              .filter(({ path }) => path === NavRoutes.DASHBOARD)
              .map(({ label, path, icon: Icon }) => {
                const isActive = location.pathname === path;

                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onNavigate}
                    className={`relative flex min-h-8 shrink-0 items-center gap-3 rounded-md pl-3 text-[0.95rem] font-medium transition-colors ${
                      isActive
                        ? "text-[#3f5fb2] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-full before:bg-[#3f5fb2]"
                        : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            <Accordion
              allowsMultipleExpanded={false}
              expandedKeys={openGroup ? [openGroup] : []}
              onExpandedChange={(keys) =>
                setOpenGroup(Array.from(keys)[0] ?? null)
              }
              className="flex flex-col gap-2"
              hideSeparator
            >
              {menuItems
                .filter(({ children }) => children)
                .map(({ label, icon: Icon, children }) => {
                  const isActive = children.some(
                    ({ path }) => location.pathname === path,
                  );

                  return (
                    <Accordion.Item
                      key={label}
                      id={label}
                      className="shrink-0 border-0"
                    >
                      <Accordion.Heading className="m-0">
                        <Accordion.Trigger
                          className={`flex h-5 w-full items-center gap-3 pl-3 rounded-md text-left text-[0.95rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5fb2] ${
                            isActive
                              ? "text-[#3f5fb2]"
                              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1">{label}</span>
                          <Accordion.Indicator className="h-4 w-4 shrink-0 transition-transform data-[expanded=true]:rotate-180">
                            <ChevronDown />
                          </Accordion.Indicator>
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel className="ml-5 border-l border-zinc-200 pl-3">
                        <Accordion.Body className="flex flex-col gap-1 py-2">
                          {children.map(
                            ({ label: childLabel, path, icon: ChildIcon }) => {
                              const isChildActive = location.pathname === path;

                              return (
                                <Link
                                  key={path}
                                  to={path}
                                  onClick={onNavigate}
                                  className={`relative flex min-h-8 shrink-0 items-center gap-2 rounded-md text-sm font-medium transition-colors ${
                                    isChildActive
                                      ? "text-[#3f5fb2] before:absolute before:-left-4 before:top-0 before:h-full before:w-1 before:rounded-full before:bg-[#3f5fb2]"
                                      : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
                                  }`}
                                  aria-current={
                                    isChildActive ? "page" : undefined
                                  }
                                >
                                  <ChildIcon className="h-4 w-4 shrink-0" />
                                  <span>{childLabel}</span>
                                </Link>
                              );
                            },
                          )}
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
            </Accordion>
            {menuItems
              .filter(({ path }) => path === NavRoutes.REPORTS)
              .map(({ label, path, icon: Icon }) => {
                const isActive = location.pathname === path;

                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onNavigate}
                    className={`relative flex min-h-10 shrink-0 items-center gap-3 rounded-md pl-3 text-[0.95rem] font-medium transition-colors ${
                      isActive
                        ? "text-[#3f5fb2] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-full before:bg-[#3f5fb2]"
                        : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
          </nav>
        </div>
      </div>

      <div className="mt-6 shrink-0 w-auto">
        <AlertDialog>
          <AlertDialog.Trigger className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-red-100 p-2 text-left text-sm font-medium text-red-500 transition-all hover:bg-red-50">
            <ArrowRightFromSquare className="h-6 w-6" />
            <span>Log Out</span>
          </AlertDialog.Trigger>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog className="sm:max-w-100">
                <AlertDialog.CloseTrigger />
                <AlertDialog.Header>
                  <AlertDialog.Icon status="accent" />
                  <AlertDialog.Heading>
                    Log out of your account?
                  </AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  <p>
                    You'll need to log in again to access your account. Any
                    unsaved changes will be lost.
                  </p>
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close" variant="tertiary">
                    Stay signed in
                  </Button>
                  <Link to={NavRoutes.LOGIN}>
                    <Button
                      slot="close"
                      variant="primary"
                      onClick={() => {
                        onNavigate();
                        removeCookie("username", { path: "/" });
                        logout();
                      }}
                    >
                      Confirm
                    </Button>
                  </Link>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
        <div className="my-6 border-t border-zinc-200" />
        <div className="flex items-center gap-3">
          <Avatar color="soft">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>

          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
                `${user?.supplier_name}`}
            </span>
            <span className="truncate text-xs text-default-500">
              {user?.role || "User"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, canAccess } = useContext(userContext);
  const firstName = user?.first_name ?? "";
  const lastName = user?.last_name ?? "";
  const supplierWords = user?.supplier_name?.split(/\s+/).filter(Boolean) ?? [];

  const staffInitials =
    firstName || lastName
      ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      : "";

  const supplierInitials = supplierWords.length
    ? supplierWords
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
    : "";

  const initials = staffInitials || supplierInitials;

  const menuItems = [
    { label: "Dashboard", path: NavRoutes.DASHBOARD, icon: LayoutCellsLarge },
    {
      label: "Transactions",
      icon: BookOpen,
      children: [
        { label: "Point of Sales", path: NavRoutes.POS, icon: Calculator },
        { label: "Sales", path: NavRoutes.SALES, icon: BookOpen },
        { label: "Expenses", path: NavRoutes.EXPENSES, icon: Receipt },
      ],
    },
    {
      label: "Inventory",
      icon: ShoppingBasket,
      children: [
        {
          label: "Products Manager",
          path: NavRoutes.PRODMANAGER,
          icon: ShoppingBasket,
        },
        {
          label: "Restock Products",
          path: NavRoutes.RESTOCKPROD,
          icon: ArrowChevronUp,
        },
      ],
    },
    {
      label: "Management",
      icon: PersonWorker,
      children: [
        {
          label: "Supplier Manager",
          path: NavRoutes.SUPMANAGER,
          icon: PersonWorker,
        },
        {
          label: "Staff Manager",
          path: NavRoutes.STAFFMANAGER,
          icon: Person,
        },
        {
          label: "Role Manager",
          path: NavRoutes.ROLEMANAGER,
          icon: Shield,
        },
      ],
    },
    {
      label: "Reports",
      path: NavRoutes.REPORTS,
      icon: ChartMixed,
    },
  ]
    .map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.filter(({ path }) => canAccess(path)),
          }
        : item,
    )
    .filter((item) =>
      item.children ? item.children.length > 0 : canAccess(item.path),
    );

  return (
    <>
      <div className="hidden md:block">
        <aside className="box-border flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-[300px] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-white px-7 py-9 shadow-md">
          <SidebarContent
            menuItems={menuItems}
            location={location}
            onNavigate={() => {}}
            user={user}
            initials={initials}
          />
        </aside>
      </div>

      <div className="md:hidden">
        <DrawerRoot isOpen={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger
            aria-label="Open navigation"
            className="fixed left-7 top-7 z-50 rounded-md bg-white p-2 text-zinc-700 shadow-md"
          >
            <Bars className="h-6 w-6" />
          </DrawerTrigger>
          <DrawerBackdrop
            variant="opaque"
            className="bg-black/30 backdrop-blur-[1px]"
          >
            <DrawerContent
              placement="left"
              className="bg-transparent shadow-none"
            >
              <DrawerDialog className="p-0 transition-transform duration-300 ease-in-out">
                <DrawerBody className="p-0">
                  <aside className="relative box-border flex h-dvh w-fit min-w-[15rem] max-w-[18rem] flex-col justify-between overflow-hidden rounded-r-[1.75rem] bg-white px-7 py-9 shadow-md">
                    <DrawerCloseTrigger
                      aria-label="Close navigation"
                      className="absolute right-5 top-5 z-10 rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                    >
                      <Xmark className="h-5 w-5" />
                    </DrawerCloseTrigger>
                    <SidebarContent
                      menuItems={menuItems}
                      location={location}
                      onNavigate={() => setIsOpen(false)}
                      user={user}
                      initials={initials}
                    />
                  </aside>
                </DrawerBody>
              </DrawerDialog>
            </DrawerContent>
          </DrawerBackdrop>
        </DrawerRoot>
      </div>
    </>
  );
}
