import clsx from "clsx";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useSidebarStore } from "../../store/useSidebarStore";
import { Sidebar } from "../sidebar/Sidebar";

export const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isCollapsed } = useSidebarStore();

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-secondary-950">
      <Sidebar />
      <main
        className={clsx(
          "transition-all duration-300 min-h-screen",
          isCollapsed ? "ml-20" : "ml-64"
        )}
      >
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
