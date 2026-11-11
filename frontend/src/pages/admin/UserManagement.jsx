import React, { useEffect, useMemo, useState } from "react";
import {
    Users,
    Search,
    RefreshCw,
    UserCheck,
    UserX,
    ShieldCheck,
    Building2,
    Heart,
    Mail,
    Phone,
    MapPin,
    AlertCircle,
    CheckCircle,
    Filter
} from "lucide-react";

import API from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./UserManagement.css";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // FETCH ALL USERS
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/admin/users");

            setUsers(response.data.users || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load users."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // ACTIVATE / DEACTIVATE USER
    const handleStatusChange = async (user) => {
        const newStatus = !user.isActive;

        const confirmed = window.confirm(
            `Are you sure you want to ${
                newStatus ? "activate" : "deactivate"
            } ${user.name}?`
        );

        if (!confirmed) return;

        try {
            setUpdatingId(user._id);
            setError("");
            setSuccess("");

            const response = await API.patch(
                `/admin/users/${user._id}/status`,
                {
                    isActive: newStatus
                }
            );

            if (response.data.success) {
                setUsers((previousUsers) =>
                    previousUsers.map((item) =>
                        item._id === user._id
                            ? {
                                ...item,
                                isActive: newStatus
                            }
                            : item
                    )
                );

                setSuccess(
                    response.data.message ||
                    "User status updated successfully."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update user status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    // FILTER USERS
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                user.name?.toLowerCase().includes(searchText) ||
                user.email?.toLowerCase().includes(searchText) ||
                user.phone?.includes(searchText) ||
                user.ngoDetails?.organizationName
                    ?.toLowerCase()
                    .includes(searchText);

            const matchesRole =
                roleFilter === "all" ||
                user.role === roleFilter;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && user.isActive) ||
                (statusFilter === "inactive" && !user.isActive);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, search, roleFilter, statusFilter]);

    const totalUsers = users.length;
    const donorCount = users.filter(
        (user) => user.role === "donor"
    ).length;

    const ngoCount = users.filter(
        (user) => user.role === "ngo"
    ).length;

    const activeCount = users.filter(
        (user) => user.isActive
    ).length;

    return (
        <DashboardLayout role="admin">
            <div className="user-management-page">

                {/* HEADER */}
                <div className="um-header">
                    <div>
                        <span className="um-eyebrow">
                            ADMINISTRATION
                        </span>

                        <h1>User Management</h1>

                        <p>
                            Manage registered donors and NGO accounts
                            across FoodBridge.
                        </p>
                    </div>

                    <button
                        className="um-refresh-button"
                        onClick={fetchUsers}
                        disabled={loading}
                    >
                        <RefreshCw size={17} />
                        Refresh
                    </button>
                </div>

                {/* STATISTICS */}
                <div className="um-stats-grid">

                    <div className="um-stat-card">
                        <div className="um-stat-icon blue">
                            <Users size={22} />
                        </div>
                        <div>
                            <span>Total Users</span>
                            <h3>{totalUsers}</h3>
                        </div>
                    </div>

                    <div className="um-stat-card">
                        <div className="um-stat-icon pink">
                            <Heart size={22} />
                        </div>
                        <div>
                            <span>Donors</span>
                            <h3>{donorCount}</h3>
                        </div>
                    </div>

                    <div className="um-stat-card">
                        <div className="um-stat-icon purple">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <span>NGOs</span>
                            <h3>{ngoCount}</h3>
                        </div>
                    </div>

                    <div className="um-stat-card">
                        <div className="um-stat-icon green">
                            <UserCheck size={22} />
                        </div>
                        <div>
                            <span>Active Users</span>
                            <h3>{activeCount}</h3>
                        </div>
                    </div>

                </div>

                {/* ALERTS */}
                {error && (
                    <div className="um-alert error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="um-alert success">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                {/* FILTERS */}
                <div className="um-filter-section">

                    <div className="um-search">
                        <Search size={19} />

                        <input
                            type="text"
                            placeholder="Search by name, email, phone or organization..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="um-filter-control">
                        <Filter size={17} />

                        <select
                            value={roleFilter}
                            onChange={(e) =>
                                setRoleFilter(e.target.value)
                            }
                        >
                            <option value="all">All Roles</option>
                            <option value="donor">Donors</option>
                            <option value="ngo">NGOs</option>
                        </select>
                    </div>

                    <select
                        className="um-status-filter"
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                </div>

                {/* RESULTS */}
                <div className="um-results-heading">
                    <div>
                        <h2>Registered Users</h2>
                        <p>
                            {filteredUsers.length} users found
                        </p>
                    </div>
                </div>

                {/* USER LIST */}
                {loading ? (
                    <div className="um-loading">
                        <div className="um-spinner"></div>
                        <p>Loading registered users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="um-empty">
                        <Users size={38} />
                        <h3>No users found</h3>
                        <p>
                            Try changing your search or filters.
                        </p>
                    </div>
                ) : (
                    <div className="um-table-wrapper">
                        <table className="um-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Contact</th>
                                    <th>Role</th>
                                    <th>Account Status</th>
                                    <th>NGO Verification</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="um-user-cell">
                                                <div className="um-avatar">
                                                    {user.name
                                                        ?.charAt(0)
                                                        .toUpperCase() || "U"}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {user.name}
                                                    </strong>

                                                    <small>
                                                        {user.ngoDetails
                                                            ?.organizationName ||
                                                            user.email}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="um-contact">
                                                <span>
                                                    <Mail size={14} />
                                                    {user.email}
                                                </span>

                                                <span>
                                                    <Phone size={14} />
                                                    {user.phone || "Not provided"}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`um-role ${user.role}`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`um-status ${
                                                    user.isActive
                                                        ? "active"
                                                        : "inactive"
                                                }`}
                                            >
                                                {user.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>

                                        <td>
                                            {user.role === "ngo" ? (
                                                <span
                                                    className={`um-verification ${
                                                        user.isVerified
                                                            ? "verified"
                                                            : "pending"
                                                    }`}
                                                >
                                                    <ShieldCheck size={14} />
                                                    {user.isVerified
                                                        ? "Verified"
                                                        : "Pending"}
                                                </span>
                                            ) : (
                                                <span className="um-not-applicable">
                                                    Not applicable
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            <button
                                                className={`um-action-button ${
                                                    user.isActive
                                                        ? "deactivate"
                                                        : "activate"
                                                }`}
                                                onClick={() =>
                                                    handleStatusChange(user)
                                                }
                                                disabled={
                                                    updatingId === user._id ||
                                                    user.role === "admin"
                                                }
                                                title={
                                                    user.role === "admin"
                                                        ? "Admin accounts cannot be changed here"
                                                        : ""
                                                }
                                            >
                                                {user.isActive ? (
                                                    <UserX size={15} />
                                                ) : (
                                                    <UserCheck size={15} />
                                                )}

                                                {updatingId === user._id
                                                    ? "Updating..."
                                                    : user.isActive
                                                        ? "Deactivate"
                                                        : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default UserManagement;