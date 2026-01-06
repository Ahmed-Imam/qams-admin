import clsx from "clsx";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderTree,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useSidebarStore } from "../../store/useSidebarStore";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    path: "/clients",
    label: "Clients",
    icon: <Building2 className="w-5 h-5" />,
  },
  { path: "/users", label: "Users", icon: <Users className="w-5 h-5" /> },
  { path: "/roles", label: "Roles", icon: <Shield className="w-5 h-5" /> },
  {
    path: "/departments",
    label: "Departments",
    icon: <FolderTree className="w-5 h-5" />,
  },
  {
    path: "/questions",
    label: "Questions",
    icon: <HelpCircle className="w-5 h-5" />,
  },
  {
    path: "/templates",
    label: "Templates",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    path: "/activity-logs",
    label: "Activity Logs",
    icon: <History className="w-5 h-5" />,
  },
  {
    path: "/settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-screen bg-secondary-900/95 backdrop-blur-xl border-r border-secondary-700/50 transition-all duration-300 z-50 flex flex-col",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-secondary-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-fadeIn">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
                <Shield className="w-6 h-6 text-primary-400" />
              </div>
              <span className="text-lg font-bold text-white">QAMS Admin</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "text-white bg-gradient-to-r from-primary-500/20 to-primary-600/10 border-l-2 border-primary-400"
                  : "text-secondary-300 hover:text-white hover:bg-white/5",
                isCollapsed && "justify-center px-3"
              )
            }
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-secondary-700/50">
        {!isCollapsed && user && (
          <div className="mb-4 p-3 rounded-xl bg-secondary-800/50 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-secondary-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200",
            isCollapsed && "justify-center px-3"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
