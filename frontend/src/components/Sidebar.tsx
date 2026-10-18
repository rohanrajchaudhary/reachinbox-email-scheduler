import {
  CalendarClock,
  CheckCircle2,
  LogOut,
  Mail,
  Settings,
  User,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const menu = [
    {
      name: "Overview",
      path: "/dashboard",
      icon: Mail,
    },
    {
      name: "Scheduled Emails",
      path: "/scheduled",
      icon: CalendarClock,
    },
    {
      name: "Sent Emails",
      path: "/sent",
      icon: CheckCircle2,
    },
  ];

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <aside className="hidden w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link
          to="/dashboard"
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
            <Mail className="h-5 w-5 text-white" />
          </div>

          <span className="text-lg font-bold text-slate-900">
            ReachInbox
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <div className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;

            const active =
              location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />

                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200">
              <User className="h-4 w-4 text-slate-600" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.name || "User"}
            </p>

            <p className="truncate text-xs text-slate-500">
              {user?.email || ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />

          <span>Logout</span>
        </button>

        <button
          type="button"
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100"
        >
          <Settings className="h-4 w-4" />

          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;