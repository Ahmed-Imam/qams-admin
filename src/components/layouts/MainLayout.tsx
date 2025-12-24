import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "../sidebar/Sidebar";
import { useAuthStore } from "../../store/useAuthStore";
import { useSidebarStore } from "../../store/useSidebarStore";
import clsx from "clsx";

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
