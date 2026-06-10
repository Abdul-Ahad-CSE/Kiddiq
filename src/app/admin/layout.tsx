import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import AdminLogoutButton from "./AdminLogoutButton";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  Package, 
  LineChart,
  UserCheck,
  Users
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/login");
  }

  const navLinks = [];
  const role = session.user.role;
  const permissions = session.user.permissions || [];

  if (role === "SUPER_ADMIN") {
    navLinks.push(
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { name: "Categories", href: "/admin/categories", icon: Layers },
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "Finance", href: "/admin/finance", icon: LineChart },
      { name: "Staff", href: "/admin/staff", icon: Users }
    );
  } else if (role === "SUB_ADMIN") {
    if (permissions.includes("VIEW_DASHBOARD")) {
      navLinks.push({ name: "Dashboard", href: "/admin", icon: LayoutDashboard });
    }
    if (permissions.includes("MANAGE_ORDERS")) {
      navLinks.push({ name: "Orders", href: "/admin/orders", icon: ShoppingBag });
    }
    if (permissions.includes("MANAGE_CATEGORIES")) {
      navLinks.push({ name: "Categories", href: "/admin/categories", icon: Layers });
    }
    if (permissions.includes("MANAGE_PRODUCTS")) {
      navLinks.push({ name: "Products", href: "/admin/products", icon: Package });
    }
    if (permissions.includes("MANAGE_FINANCE")) {
      navLinks.push({ name: "Finance", href: "/admin/finance", icon: LineChart });
    }
  }

  if (navLinks.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mx-auto">
            <UserCheck className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
            <p className="text-sm text-slate-500 mt-2">
              Your account does not have any administrator permissions. Please contact a Super Admin to assign roles.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <AdminLogoutButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-50 font-sans">
      {/* Sidebar for Desktop, Top header for mobile */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-blue-600">
              Kiddiq Admin
            </span>
          </Link>
          <div className="md:hidden">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Admin
            </span>
          </div>
        </div>

        {/* Admin Info Card */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {session.user.name || "Administrator"}
            </p>
            <p className="text-[10px] font-medium text-slate-400 truncate">
              {session.user.email}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          {navLinks.map((link) => {
            const LinkIcon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-[48px] min-w-[100px] md:min-w-0 items-center gap-3 rounded-xl px-4 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shrink-0"
              >
                <LinkIcon className="h-5 w-5 shrink-0" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions (Logout) */}
        <div className="p-4 border-t border-slate-100 hidden md:block">
          <AdminLogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header for mobile logout */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-end px-6 md:hidden">
          <AdminLogoutButton />
        </header>

        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
