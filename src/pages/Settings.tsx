import React from "react";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Lock,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export const Settings: React.FC = () => {
  const { user } = useAuthStore();

  const settingsSections = [
    {
      title: "Profile Settings",
      description: "Manage your personal information and preferences",
      icon: <User className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Notifications",
      description: "Configure email and push notification preferences",
      icon: <Bell className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Security",
      description: "Manage password and two-factor authentication",
      icon: <Lock className="w-6 h-6" />,
      color: "from-red-500 to-red-600",
    },
    {
      title: "Permissions",
      description: "View and manage system-wide permissions",
      icon: <Shield className="w-6 h-6" />,
      color: "from-amber-500 to-amber-600",
    },
    {
      title: "Appearance",
      description: "Customize the look and feel of the admin panel",
      icon: <Palette className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Database",
      description: "View database status and backups",
      icon: <Database className="w-6 h-6" />,
      color: "from-cyan-500 to-cyan-600",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-secondary-400">Manage your account and application settings</p>
      </div>

      {/* User Info Card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-500/30">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-secondary-400">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="badge-info">
                {typeof user?.role === "object" ? user.role.name : "Admin"}
              </span>
              <span className="badge-success">{user?.status || "Active"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section, index) => (
          <div
            key={section.title}
            className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300 cursor-pointer group animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
              {section.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
              {section.title}
            </h3>
            <p className="text-sm text-secondary-400">{section.description}</p>
          </div>
        ))}
      </div>

      {/* System Info */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary-800/50 rounded-xl">
            <p className="text-xs text-secondary-500 uppercase tracking-wider mb-1">Version</p>
            <p className="text-lg font-semibold text-white">1.0.0</p>
          </div>
          <div className="p-4 bg-secondary-800/50 rounded-xl">
            <p className="text-xs text-secondary-500 uppercase tracking-wider mb-1">Environment</p>
            <p className="text-lg font-semibold text-white">Development</p>
          </div>
          <div className="p-4 bg-secondary-800/50 rounded-xl">
            <p className="text-xs text-secondary-500 uppercase tracking-wider mb-1">API Status</p>
            <p className="text-lg font-semibold text-emerald-400">Connected</p>
          </div>
          <div className="p-4 bg-secondary-800/50 rounded-xl">
            <p className="text-xs text-secondary-500 uppercase tracking-wider mb-1">Last Updated</p>
            <p className="text-lg font-semibold text-white">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
