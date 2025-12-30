import clsx from "clsx";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientsAPI } from "../api/clients";
import { usersAPI } from "../api/users";
import type { Client, User } from "../types";

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isPositive: boolean };
  path: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, usersData] = await Promise.all([
          clientsAPI.getAll(),
          usersAPI.getAll({ limit: 100 }),
        ]);
        setClients(clientsData || []);
        setUsers(usersData?.data || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeUsers = users.filter((u) => u.status === "active").length;
  const inactiveUsers = users.filter((u) => u.status !== "active").length;

  const stats: StatCard[] = [
    {
      title: "Total Clients",
      value: clients.length,
      icon: <Building2 className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
      trend: { value: 12, isPositive: true },
      path: "/clients",
    },
    {
      title: "Total Users",
      value: users.length,
      icon: <Users className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      trend: { value: 8, isPositive: true },
      path: "/users",
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: <UserCheck className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600",
      trend: { value: 5, isPositive: true },
      path: "/users",
    },
    {
      title: "Inactive Users",
      value: inactiveUsers,
      icon: <UserX className="w-6 h-6" />,
      color: "from-amber-500 to-amber-600",
      trend: { value: 2, isPositive: false },
      path: "/users",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-secondary-400">Welcome to QAMS Admin Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            onClick={() => navigate(stat.path)}
            className="stat-card cursor-pointer group hover:scale-[1.02] animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
              >
                {stat.icon}
              </div>
              {stat.trend && (
                <div
                  className={clsx(
                    "flex items-center gap-1 text-sm font-medium",
                    stat.trend.isPositive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {stat.trend.isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.trend.value}%
                </div>
              )}
            </div>
            <p className="text-secondary-400 text-sm mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Clients</h2>
            <button
              onClick={() => navigate("/clients")}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {clients.slice(0, 5).map((client) => (
              <div
                key={client._id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary-700/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/clients/${client._id}`)}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center border border-primary-500/20">
                  <Building2 className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {client.name}
                  </p>
                  <p className="text-sm text-secondary-400 capitalize">
                    {client.type}
                  </p>
                </div>
                <span className="badge-info">{client.classification}</span>
              </div>
            ))}
            {clients.length === 0 && (
              <p className="text-center text-secondary-400 py-8">
                No clients found
              </p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Users</h2>
            <button
              onClick={() => navigate("/users")}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {users.slice(0, 5).map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary-700/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/users/${user._id}`)}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-secondary-400 truncate">
                    {user.email}
                  </p>
                </div>
                <span
                  className={clsx(
                    user.status === "active" ? "badge-success" : "badge-warning"
                  )}
                >
                  {user.status}
                </span>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center text-secondary-400 py-8">
                No users found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
