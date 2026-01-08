import clsx from "clsx";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  Search,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  activityLogsAPI,
  type ActivityLog,
  type GetActivityLogsParams,
} from "../api/activityLogs";
import { usersAPI } from "../api/users";
import type { User } from "../types";

const ENTITY_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "role", label: "Role" },
  { value: "user", label: "User" },
  { value: "client", label: "Client" },
  { value: "department", label: "Department" },
  { value: "document", label: "Document" },
  { value: "document_type", label: "Document Type" },
  { value: "document_settings", label: "Document Settings" },
  { value: "document_template", label: "Document Template" },
  { value: "workflow", label: "Workflow" },
  { value: "accreditation", label: "Accreditation" },
  { value: "form", label: "Form" },
  { value: "submission", label: "Submission" },
  { value: "capa", label: "CAPA" },
  { value: "capa_category", label: "CAPA Category" },
  { value: "escalation_rule", label: "Escalation Rule" },
  { value: "form_capa_settings", label: "Form CAPA Settings" },
  { value: "root_cause_method", label: "Root Cause Method" },
  { value: "checklist", label: "Checklist" },
  { value: "checklist_execution", label: "Checklist Execution" },
  { value: "equipment", label: "Equipment" },
  { value: "template", label: "Template" },
  { value: "question", label: "Question" },
  { value: "action", label: "Action" },
  { value: "committee", label: "Committee" },
  { value: "meeting", label: "Meeting" },
  { value: "governance", label: "Governance" },
];

const OPERATION_OPTIONS = [
  { value: "", label: "All Operations" },
  { value: "insert", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
];

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [entityFilter, setEntityFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [entityNameFilter, setEntityNameFilter] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const userSearchRef = useRef<HTMLDivElement>(null);

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const fetchLogs = async (params?: GetActivityLogsParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await activityLogsAPI.getAll({
        page: params?.page || page,
        pageSize: params?.pageSize || pageSize,
        entity: params?.entity || entityFilter || undefined,
        operation:
          params?.operation ||
          (operationFilter as "insert" | "update" | "delete" | undefined) ||
          undefined,
        by: params?.by || selectedUser?._id || undefined,
        entityName: params?.entityName || entityNameFilter || undefined,
        fromDate:
          params?.fromDate ||
          (dateFrom ? new Date(dateFrom).toISOString() : undefined),
        toDate:
          params?.toDate ||
          (dateTo ? new Date(dateTo + "T23:59:59").toISOString() : undefined),
      });
      setLogs(response.items || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.total || 0);
      if (params?.page) setPage(params.page);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch activity logs";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs({ page: 1, pageSize: 20 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // User search with debounce
  useEffect(() => {
    const query = userSearch.trim();
    if (query.length < 2) {
      setUserSuggestions([]);
      setIsSearchingUsers(false);
      return;
    }

    let isCancelled = false;

    const run = async () => {
      if (isCancelled) return;
      setIsSearchingUsers(true);

      try {
        const res = await usersAPI.getAll({
          page: 1,
          limit: 10,
          search: query,
        });
        if (isCancelled) return;
        setUserSuggestions(res.data || []);
      } catch (error: any) {
        if (!isCancelled) {
          toast.error(
            error?.response?.data?.message || "Failed to search users"
          );
          setUserSuggestions([]);
        }
      } finally {
        if (!isCancelled) setIsSearchingUsers(false);
      }
    };

    const t = setTimeout(run, 300);
    return () => {
      isCancelled = true;
      clearTimeout(t);
    };
  }, [userSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userSearchRef.current &&
        !userSearchRef.current.contains(event.target as Node)
      ) {
        setUserSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Apply filters with debounce when filter values change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLogs({ page: 1, pageSize });
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    entityFilter,
    operationFilter,
    dateFrom,
    dateTo,
    selectedUser,
    entityNameFilter,
  ]);

  const handlePageChange = (newPage: number) => {
    fetchLogs({ page: newPage, pageSize });
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setUserSearch(`${user.firstName} ${user.lastName}`);
    setUserSuggestions([]);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setUserSearch("");
    setUserSuggestions([]);
  };

  const getOperationBadge = (operation: string) => {
    const config = {
      insert: {
        bg: "badge-success",
        label: "Created",
      },
      update: {
        bg: "badge-info",
        label: "Updated",
      },
      delete: {
        bg: "badge-danger",
        label: "Deleted",
      },
    };
    const op = config[operation as keyof typeof config] || config.update;
    return <span className={clsx("badge", op.bg)}>{op.label}</span>;
  };

  const getUserName = (log: ActivityLog): string => {
    if (typeof log.by === "object" && log.by) {
      return `${log.by.firstName} ${log.by.lastName}`;
    }
    return "Unknown User";
  };

  const getUserEmail = (log: ActivityLog): string => {
    if (typeof log.by === "object" && log.by) {
      return log.by.email;
    }
    return "-";
  };

  const getUserInitials = (log: ActivityLog): string => {
    if (typeof log.by === "object" && log.by) {
      return (
        `${log.by.firstName?.[0] || ""}${
          log.by.lastName?.[0] || ""
        }`.toUpperCase() || "U"
      );
    }
    return "U";
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Activity Logs</h1>
          <p className="text-secondary-400">
            View and filter system activity logs
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-secondary-400" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-400">
                  Error loading activity logs
                </h3>
                <p className="mt-1 text-sm text-red-300/80">{error}</p>
              </div>
              <button
                onClick={() => fetchLogs({ page, pageSize })}
                className="text-sm font-medium text-red-400 hover:text-red-300"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* User Search */}
          <div className="relative" ref={userSearchRef}>
            {selectedUser ? (
              <div className="relative w-full h-[42px] px-3 bg-primary-500/10 border border-primary-500/30 rounded-xl flex items-center">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                    {selectedUser.firstName?.[0] ||
                      selectedUser.email?.[0] ||
                      "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-primary-400 truncate">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                  </div>
                  <button
                    onClick={handleClearUser}
                    className="flex-shrink-0 text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onFocus={() => {
                    if (
                      userSearch.trim().length >= 2 &&
                      userSuggestions.length === 0 &&
                      !isSearchingUsers
                    ) {
                      const query = userSearch.trim();
                      if (query.length >= 2) {
                        usersAPI
                          .getAll({ page: 1, limit: 10, search: query })
                          .then((res) => {
                            setUserSuggestions(res.data || []);
                          });
                      }
                    }
                  }}
                  placeholder="Search user..."
                  className="input-field pl-10"
                />
              </div>
            )}
            {(isSearchingUsers || userSuggestions.length > 0) &&
              !selectedUser && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-secondary-800 border border-secondary-700/50 rounded-xl shadow-xl z-50 max-h-60 overflow-auto">
                  {isSearchingUsers && (
                    <div className="px-3 py-2 text-sm text-secondary-400">
                      Searching...
                    </div>
                  )}
                  {!isSearchingUsers &&
                    userSuggestions.length === 0 &&
                    userSearch.trim().length >= 2 && (
                      <div className="px-3 py-2 text-sm text-secondary-400">
                        No users found
                      </div>
                    )}
                  {!isSearchingUsers &&
                    userSuggestions.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="w-full text-left px-3 py-2 hover:bg-secondary-700/50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xs font-semibold text-white">
                          {user.firstName?.[0] || user.email?.[0] || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-secondary-400 truncate">
                            {user.email}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="input-field"
          >
            {ENTITY_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-secondary-800"
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            className="input-field"
          >
            {OPERATION_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-secondary-800"
              >
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={entityNameFilter}
            onChange={(e) => setEntityNameFilter(e.target.value)}
            placeholder="Entity name..."
            className="input-field"
          />

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From Date"
            className="input-field"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To Date"
            className="input-field"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-700/50">
                <th className="table-header">User</th>
                <th className="table-header">Operation</th>
                <th className="table-header">Entity</th>
                <th className="table-header">Entity Name</th>
                <th className="table-header">Timestamp</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={log._id}
                  className="border-b border-secondary-700/30 hover:bg-secondary-800/30 transition-colors animate-fadeIn"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                        {getUserInitials(log)}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {getUserName(log)}
                        </div>
                        <div className="text-xs text-secondary-400">
                          {getUserEmail(log)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {getOperationBadge(log.operation)}
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-medium text-secondary-200 capitalize">
                      {log.entity.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-secondary-300">
                      {log.entityName || "-"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col">
                      <div className="text-sm text-secondary-300">
                        {format(new Date(log.ts), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {format(new Date(log.ts), "HH:mm:ss")}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-primary-400 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
              <p className="text-secondary-400">No activity logs found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-secondary-700/30 flex items-center justify-between">
            <p className="text-sm text-secondary-400">
              Showing{" "}
              <span className="font-medium text-white">
                {logs.length > 0 ? (page - 1) * pageSize + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium text-white">
                {Math.min(page * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-medium text-white">{totalCount}</span>{" "}
              results
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
                className="p-2 rounded-lg hover:bg-secondary-700 text-secondary-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5) {
                    if (page > 3) p = page - 2 + i;
                    if (p > totalPages) p = totalPages - (4 - i);
                    if (p < 1) p = i + 1;
                  }

                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={clsx(
                        "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                        page === p
                          ? "bg-primary-600 text-white"
                          : "hover:bg-secondary-700 text-secondary-400 hover:text-white"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || loading}
                className="p-2 rounded-lg hover:bg-secondary-700 text-secondary-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Activity Log Details
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  User
                </label>
                <div className="flex items-center gap-3 p-3 bg-secondary-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                    {getUserInitials(selectedLog)}
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {getUserName(selectedLog)}
                    </div>
                    <div className="text-sm text-secondary-400">
                      {getUserEmail(selectedLog)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Operation
                  </label>
                  <div className="p-3 bg-secondary-800/50 rounded-xl">
                    {getOperationBadge(selectedLog.operation)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Entity
                  </label>
                  <div className="p-3 bg-secondary-800/50 rounded-xl">
                    <span className="text-sm text-secondary-200 capitalize">
                      {selectedLog.entity.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Entity Name
                </label>
                <div className="p-3 bg-secondary-800/50 rounded-xl">
                  <span className="text-sm text-secondary-200">
                    {selectedLog.entityName || "-"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Timestamp
                </label>
                <div className="p-3 bg-secondary-800/50 rounded-xl">
                  <div className="text-sm text-secondary-200">
                    {format(new Date(selectedLog.ts), "PPpp")}
                  </div>
                </div>
              </div>

              {selectedLog.from && (
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Previous Values
                  </label>
                  <div className="p-3 bg-secondary-800/50 rounded-xl">
                    <pre className="text-xs text-secondary-300 overflow-auto">
                      {JSON.stringify(selectedLog.from, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.to && (
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    New Values
                  </label>
                  <div className="p-3 bg-secondary-800/50 rounded-xl">
                    <pre className="text-xs text-secondary-300 overflow-auto">
                      {JSON.stringify(selectedLog.to, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-secondary-700/50">
              <button
                onClick={() => setSelectedLog(null)}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
