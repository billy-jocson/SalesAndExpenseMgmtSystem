import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import CalculaLogo from "../assets/Logo.svg";
import { NavRoutes } from "../NavRoutes";
import {
  Avatar,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDialog,
  DrawerRoot,
  DrawerTrigger,
} from "@heroui/react";
import { useCookies } from "react-cookie";
import useSessionStorage from "../hooks/useSessionStorage";
import {
  LayoutCellsLarge,
  Calculator,
  ShoppingBasket,
  BookOpen,
  Receipt,
  PersonWorker,
  ArrowChevronUp,
  ArrowRightFromSquare,
  Bars,
  Xmark,
} from "@gravity-ui/icons";

function SidebarContent({ menuItems, location, onNavigate, user, initials }) {
  const [, , removeCookie] = useCookies(["username"]);
  const [, setSessionData] = useSessionStorage("data", null);

  return (
    <>
      <div>
        <Link
          to={NavRoutes.DASHBOARD}
          onClick={onNavigate}
          aria-label="Calcula dashboard"
          className="shrink-0"
        >
          <img src={CalculaLogo} alt="Calcula" className="w-28" />
        </Link>

        <div className="mt-10 flex min-h-0 flex-1 flex-col">
          <p className="mb-3 text-[0.7rem] font-bold uppercase text-zinc-500">
            Menu
          </p>
          <nav
            className="flex min-h-0 flex-col gap-1 overflow-y-auto"
            aria-label="Main navigation"
          >
            {menuItems.map(({ label, path, icon: Icon }) => {
              const isActive = location.pathname === path;

              return (
                <Link
                  key={path}
                  to={path}
                  onClick={onNavigate}
                  className={`relative flex min-h-12 shrink-0 items-center gap-3 rounded-md overflow-clip pl-3 text-[0.95rem] font-medium transition-colors ${
                    isActive
                      ? "text-[#3f5fb2] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#3f5fb2]"
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

      <div className="mt-6 shrink-0">
        <Link
          onClick={() => {
            onNavigate();
            removeCookie("username", { path: "/" });
            setSessionData(null);
          }}
          className="flex min-h-11 items-center gap-3 rounded-md border border-red-400 px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          to={NavRoutes.LOGIN}
        >
          <ArrowRightFromSquare className="h-6 w-6" />
          <span>Log Out</span>
        </Link>
        <div className="my-6 border-t border-zinc-200" />
        <div className="flex items-center gap-3">
          <Avatar color="soft">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>

          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
                "User"}
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
  const [sessionData] = useSessionStorage("data", null);
  const user = sessionData?.user ?? sessionData;
  const firstName = user?.first_name ?? "";
  const lastName = user?.last_name ?? "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const menuItems = [
    { label: "Dashboard", path: NavRoutes.DASHBOARD, icon: LayoutCellsLarge },
    { label: "Point of Sales", path: NavRoutes.POS, icon: Calculator },
    {
      label: "Products Manager",
      path: NavRoutes.PRODMANAGER,
      icon: ShoppingBasket,
    },
    { label: "Sales", path: NavRoutes.SALES, icon: BookOpen },
    { label: "Expenses", path: NavRoutes.EXPENSES, icon: Receipt },
    {
      label: "Supplier Manager",
      path: NavRoutes.SUPMANAGER,
      icon: PersonWorker,
    },
    {
      label: "Restock Products",
      path: NavRoutes.RESTOCKPROD,
      icon: ArrowChevronUp,
    },
  ];

  return (
    <>
      <div className="hidden md:block">
        <aside className="box-border flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-[min(18rem,calc(100vw-2rem))] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-white px-7 py-9 shadow-md">
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
                  <aside className="relative box-border flex h-dvh w-[min(18rem,calc(100vw-2rem))] flex-col justify-between overflow-hidden rounded-r-[1.75rem] bg-white px-7 py-9 shadow-md">
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
