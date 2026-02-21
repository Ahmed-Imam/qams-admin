import {
  Building2,
  Edit,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
  Filter,
} from "lucide-react";
import { SlideInModal } from "../components/SlideInModal";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { clientsAPI } from "../api/clients";
import { usersAPI } from "../api/users";
import type { Client, ClientType, CreateClientDto, User } from "../types";
import { ConfirmationModal } from "../components/ConfirmationModal";
import clsx from "clsx";

const clientTypes: ClientType[] = [
  "hospital",
  "laboratory",
  "clinic",
  "pharmacy",
  "other",
];

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<CreateClientDto>({
    name: "",
    type: "hospital",
    classification: "",
    address: "",
  });
  const [activeTab, setActiveTab] = useState<"details" | "users">("details");
  const [clientUsers, setClientUsers] = useState<User[]>([]);
  const [loadingManageUsers, setLoadingManageUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const userSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const userAutocompleteRef = useRef<HTMLDivElement>(null);

  const fetchClients = async () => {
    try {
      const data = await clientsAPI.getAll();
      setClients(data || []);
    } catch (error) {
      toast.error("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.classification.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || client.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await clientsAPI.update(editingClient._id, formData);
        toast.success("Client updated successfully");
      } else {
        await clientsAPI.create(formData);
        toast.success("Client created successfully");
      }
      setShowModal(false);
      setEditingClient(null);
      setFormData({
        name: "",
        type: "hospital",
        classification: "",
        address: "",
      });
      fetchClients();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      type: client.type,
      classification: client.classification,
      address: client.address,
    });
    setActiveTab("details");
    setShowModal(true);
  };

  const openDeleteConfirm = (id: string, name: string) => {
    setClientToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await clientsAPI.delete(clientToDelete.id);
      toast.success("Client deleted successfully");
      fetchClients();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete client");
      throw error;
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: "",
      type: "hospital",
      classification: "",
      address: "",
    });
    setActiveTab("details");
    setClientUsers([]);
    setUserSearchQuery("");
    setUserSearchResults([]);
    setUserDropdownOpen(false);
  };

  const openManageUsers = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      type: client.type,
      classification: client.classification,
      address: client.address,
    });
    setActiveTab("users");
    setShowModal(true);
    setClientUsers([]);
    setUserSearchQuery("");
    setUserSearchResults([]);
  };

  const fetchClientUsers = useCallback(async () => {
    if (!editingClient) return;
    setLoadingManageUsers(true);
    try {
      const clientWithUsers = await clientsAPI.getByIdWithUsers(
        editingClient._id,
      );
      setClientUsers(clientWithUsers.users || []);
    } catch (error) {
      toast.error("Failed to load users");
      closeModal();
    } finally {
      setLoadingManageUsers(false);
    }
  }, [editingClient]);

  useEffect(() => {
    if (showModal && activeTab === "users" && editingClient) {
      fetchClientUsers();
    }
  }, [showModal, activeTab, editingClient, fetchClientUsers]);

  const handleAddUserToClient = async (userId: string) => {
    if (!editingClient) return;
    try {
      await clientsAPI.addUser(editingClient._id, userId);
      toast.success("User added to client");
      setUserSearchQuery("");
      setUserSearchResults([]);
      setUserDropdownOpen(false);
      fetchClientUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add user");
    }
  };

  const handleRemoveUserFromClient = async (userId: string) => {
    if (!editingClient) return;
    if (!confirm("Remove this user from the client?")) return;
    try {
      await clientsAPI.removeUser(editingClient._id, userId);
      toast.success("User removed from client");
      fetchClientUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to remove user");
    }
  };

  const userSearchResultsNotInClient = userSearchResults.filter(
    (u) => !clientUsers.some((cu) => cu._id === u._id),
  );

  useEffect(() => {
    if (!showModal || activeTab !== "users" || !userSearchQuery.trim()) {
      setUserSearchResults([]);
      setUserSearchLoading(false);
      return;
    }
    if (userSearchDebounceRef.current) {
      clearTimeout(userSearchDebounceRef.current);
    }
    userSearchDebounceRef.current = setTimeout(() => {
      setUserSearchLoading(true);
      usersAPI
        .getAll({ search: userSearchQuery.trim(), limit: 20 })
        .then((res) => setUserSearchResults(res.data || []))
        .catch(() => setUserSearchResults([]))
        .finally(() => {
          setUserSearchLoading(false);
          userSearchDebounceRef.current = null;
        });
    }, 300);
    return () => {
      if (userSearchDebounceRef.current) {
        clearTimeout(userSearchDebounceRef.current);
      }
    };
  }, [showModal, activeTab, userSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userAutocompleteRef.current &&
        !userAutocompleteRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6 animate-fadeIn min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Clients</h1>
          <p className="text-secondary-400">Manage organization clients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-secondary-500 hover:text-white hover:bg-secondary-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field pl-10 pr-8 min-w-[150px]"
          >
            <option value="all" className="bg-secondary-800">
              All Types
            </option>
            {clientTypes.map((type) => (
              <option
                key={type}
                value={type}
                className="bg-secondary-800 capitalize"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client, index) => (
          <div
            key={client._id}
            className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
                <Building2 className="w-6 h-6 text-primary-400" />
              </div>
              <div className="relative group">
                <button className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-44 bg-secondary-800 border border-secondary-700/50 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => handleEdit(client)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-secondary-300 hover:text-white hover:bg-secondary-700/50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(client._id, client.name)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-b-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              {client.name}
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-secondary-400">
                <span className="badge-info capitalize">{client.type}</span>
                <span className="badge-success">{client.classification}</span>
              </div>
              <div className="flex items-center gap-2 text-secondary-400">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{client.address}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-secondary-700/50">
              <p className="text-xs text-secondary-500">
                Created: {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-12 min-h-[70vh]">
            <Building2 className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
            <p className="text-secondary-400">No clients found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <SlideInModal
        isOpen={showModal}
        onClose={closeModal}
        title={editingClient ? "Edit Client" : "Add New Client"}
        icon={Building2}
        iconColor="primary"
        badges={
          editingClient
            ? [
                { label: editingClient.type, variant: "default" },
                { label: editingClient.classification, variant: "default" },
              ]
            : []
        }
        size="md"
        footer={
          activeTab === "details" ? (
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="client-form"
                className="btn-primary flex-1"
              >
                {editingClient ? "Update Client" : "Create Client"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          )
        }
      >
        <div className="space-y-6">
          {editingClient && (
            <div className="flex bg-secondary-800/50 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("details")}
                className={clsx(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === "details"
                    ? "bg-secondary-700 text-white shadow-sm"
                    : "text-secondary-400 hover:text-white hover:bg-secondary-700/50",
                )}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={clsx(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === "users"
                    ? "bg-secondary-700 text-white shadow-sm"
                    : "text-secondary-400 hover:text-white hover:bg-secondary-700/50",
                )}
              >
                Users
              </button>
            </div>
          )}

          <div className={activeTab === "details" ? "block" : "hidden"}>
            <form
              id="client-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="glass-card p-4">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                  Client Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="input-field"
                      placeholder="Client name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as ClientType,
                        })
                      }
                      className="input-field"
                      required
                    >
                      {clientTypes.map((type) => (
                        <option
                          key={type}
                          value={type}
                          className="bg-secondary-800"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Classification
                    </label>
                    <input
                      type="text"
                      value={formData.classification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          classification: e.target.value,
                        })
                      }
                      className="input-field"
                      placeholder="e.g., Private, Government"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="input-field min-h-[80px] resize-none"
                      placeholder="Full address"
                      required
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className={activeTab === "users" ? "block space-y-4" : "hidden"}>
            {loadingManageUsers ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="mb-4 flex-shrink-0" ref={userAutocompleteRef}>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Add user to client
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setUserDropdownOpen(true);
                      }}
                      onFocus={() => setUserDropdownOpen(true)}
                      placeholder="Search by name or email..."
                      className="input-field pl-9 w-full"
                      autoComplete="off"
                    />
                    {userDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-secondary-800 border border-secondary-700/50 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                        {userSearchLoading ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-secondary-400 text-sm">
                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            Searching...
                          </div>
                        ) : userSearchQuery.trim().length < 2 ? (
                          <div className="py-4 px-4 text-secondary-400 text-sm text-center">
                            Type at least 2 characters to search users
                          </div>
                        ) : userSearchResultsNotInClient.length === 0 ? (
                          <div className="py-4 px-4 text-secondary-400 text-sm text-center">
                            {userSearchResults.length === 0
                              ? "No users found"
                              : "All matching users are already in this client"}
                          </div>
                        ) : (
                          userSearchResultsNotInClient.map((user) => (
                            <button
                              key={user._id}
                              type="button"
                              onClick={() => handleAddUserToClient(user._id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary-700/50 transition-colors border-b border-secondary-700/30 last:border-0"
                            >
                              <div className="p-1.5 rounded-lg bg-primary-500/20">
                                <UserPlus className="w-4 h-4 text-primary-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-medium truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-secondary-400 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-secondary-700/50 rounded-xl overflow-hidden flex-1 min-h-0">
                  <div className="overflow-y-auto divide-y divide-secondary-700/50">
                    {clientUsers.length === 0 ? (
                      <div className="py-8 text-center text-secondary-400 text-sm">
                        No users assigned to this client yet.
                      </div>
                    ) : (
                      clientUsers.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-secondary-700/30 transition-colors"
                        >
                          <div>
                            <p className="text-white font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-secondary-400">
                              {user.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveUserFromClient(user._id)}
                            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            title="Remove from client"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SlideInModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        itemName={clientToDelete?.name}
        confirmText="Delete Client"
        variant="danger"
      />
    </div>
  );
};
