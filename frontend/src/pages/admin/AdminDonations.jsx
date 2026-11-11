import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    Package,
    Users,
    CheckCircle,
    Clock,
    Truck,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    MapPin,
    Calendar,
    Filter
} from "lucide-react";

import api from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./AdminDonations.css";

const STATUSES = [
    "ALL",
    "AVAILABLE",
    "ACCEPTED",
    "PICKED_UP",
    "COMPLETED",
    "EXPIRED",
    "CANCELLED"
];

const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getStatusClass = (status) => {
    return String(status || "unknown").toLowerCase().replaceAll("_", "-");
};

const getDonorName = (donation) => {
    return donation?.donor?.name || "Unknown donor";
};

const getNgoName = (donation) => {
    return donation?.ngo?.name || "Not assigned";
};

const AdminDonations = () => {
    const [donations, setDonations] = useState([]);
    const [pagination, setPagination] = useState({
        totalDonations: 0,
        currentPage: 1,
        totalPages: 1,
        pageSize: 10
    });

    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selectedDonation, setSelectedDonation] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const fetchDonations = useCallback(async (page = 1, selectedStatus = status) => {
        try {
            setError("");
            setLoading(true);

            const params = {
                page,
                limit: 10
            };

            if (selectedStatus !== "ALL") {
                params.status = selectedStatus;
            }

            const response = await api.get("/admin/donations", { params });

            const data = response.data;

            setDonations(Array.isArray(data.donations) ? data.donations : []);

            setPagination({
                totalDonations: data.pagination?.totalDonations || 0,
                currentPage: data.pagination?.currentPage || page,
                totalPages: Math.max(data.pagination?.totalPages || 1, 1),
                pageSize: data.pagination?.pageSize || 10
            });
        } catch (err) {
            console.error("Admin donations error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load donations. Please try again."
            );

            setDonations([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [status]);

    useEffect(() => {
        fetchDonations(1, status);
    }, [status, fetchDonations]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDonations(pagination.currentPage, status);
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > pagination.totalPages) return;

        fetchDonations(page, status);
    };

    const filteredDonations = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return donations;

        return donations.filter((donation) => {
            const searchableValues = [
                donation.foodName,
                donation.category,
                donation.status,
                getDonorName(donation),
                donation.donor?.email,
                donation.donor?.phone,
                getNgoName(donation),
                donation.ngo?.email,
                donation.address
            ];

            return searchableValues.some((value) =>
                String(value || "").toLowerCase().includes(query)
            );
        });
    }, [donations, search]);

    const pageStart = pagination.totalDonations === 0
        ? 0
        : (pagination.currentPage - 1) * pagination.pageSize + 1;

    const pageEnd = Math.min(
        pagination.currentPage * pagination.pageSize,
        pagination.totalDonations
    );

    return (
        <DashboardLayout role="admin">
            <div className="admin-donations-page">

                <div className="admin-donations-header">
                    <div>
                        <span className="admin-donations-eyebrow">
                            ADMINISTRATION
                        </span>

                        <h1>Donation Management</h1>

                        <p>
                            Monitor food donations and track their collection status.
                        </p>
                    </div>

                    <button
                        className="admin-donations-refresh"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? "spinning" : ""}
                        />
                        Refresh
                    </button>
                </div>

                <div className="admin-donations-summary">
                    <div className="admin-donation-summary-card">
                        <div className="admin-donation-summary-icon purple">
                            <Package size={21} />
                        </div>
                        <div>
                            <span>Total Donations</span>
                            <h2>{pagination.totalDonations}</h2>
                        </div>
                    </div>

                    <div className="admin-donation-summary-card">
                        <div className="admin-donation-summary-icon green">
                            <CheckCircle size={21} />
                        </div>
                        <div>
                            <span>Current Page</span>
                            <h2>{pagination.currentPage}</h2>
                        </div>
                    </div>

                    <div className="admin-donation-summary-card">
                        <div className="admin-donation-summary-icon orange">
                            <Users size={21} />
                        </div>
                        <div>
                            <span>Records Per Page</span>
                            <h2>{pagination.pageSize}</h2>
                        </div>
                    </div>
                </div>

                <div className="admin-donations-toolbar">
                    <div className="admin-donations-search">
                        <Search size={19} />
                        <input
                            type="text"
                            placeholder="Search this page by food, donor, NGO..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div className="admin-donations-filter">
                        <Filter size={18} />

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            {STATUSES.map((item) => (
                                <option key={item} value={item}>
                                    {item === "ALL"
                                        ? "All Statuses"
                                        : item.replaceAll("_", " ")}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="admin-donations-error">
                        <p>{error}</p>
                        <button onClick={() => fetchDonations(1, status)}>
                            Try Again
                        </button>
                    </div>
                )}

                <div className="admin-donations-table-card">
                    <div className="admin-donations-table-heading">
                        <div>
                            <h2>All Food Donations</h2>
                            <p>
                                Review donation information and current progress.
                            </p>
                        </div>

                        <span className="admin-donations-count">
                            {pagination.totalDonations} records
                        </span>
                    </div>

                    {loading ? (
                        <div className="admin-donations-state">
                            <div className="admin-donations-loader" />
                            <p>Loading donations...</p>
                        </div>
                    ) : filteredDonations.length === 0 ? (
                        <div className="admin-donations-state">
                            <Package size={42} />
                            <h3>No donations found</h3>
                            <p>
                                {search
                                    ? "Try another search term."
                                    : "There are no donations matching this filter."}
                            </p>
                        </div>
                    ) : (
                        <div className="admin-donations-table-wrapper">
                            <table className="admin-donations-table">
                                <thead>
                                    <tr>
                                        <th>Food Donation</th>
                                        <th>Donor</th>
                                        <th>NGO</th>
                                        <th>Quantity</th>
                                        <th>Status</th>
                                        <th>Expiry</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredDonations.map((donation) => (
                                        <tr key={donation._id}>
                                            <td>
                                                <div className="admin-food-cell">
                                                    {donation.imageUrl ? (
                                                        <img
                                                            src={donation.imageUrl}
                                                            alt={donation.foodName || "Food"}
                                                        />
                                                    ) : (
                                                        <div className="admin-food-placeholder">
                                                            <Package size={20} />
                                                        </div>
                                                    )}

                                                    <div>
                                                        <strong>
                                                            {donation.foodName || "Unnamed food"}
                                                        </strong>
                                                        <span>
                                                            {donation.category || "Other"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="admin-person-cell">
                                                    <strong>{getDonorName(donation)}</strong>
                                                    <span>{donation.donor?.email || "No email"}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="admin-person-cell">
                                                    <strong>{getNgoName(donation)}</strong>
                                                    <span>
                                                        {donation.ngo?.email || "—"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <strong>
                                                    {donation.quantity || 0}{" "}
                                                    {donation.unit || ""}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-donation-status ${getStatusClass(
                                                        donation.status
                                                    )}`}
                                                >
                                                    {String(donation.status || "UNKNOWN")
                                                        .replaceAll("_", " ")}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="admin-donation-date">
                                                    {formatDate(donation.expiryTime)}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="admin-donation-view-button"
                                                    onClick={() => setSelectedDonation(donation)}
                                                    title="View donation details"
                                                >
                                                    <Eye size={17} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && (
                        <div className="admin-donations-pagination">
                            <span>
                                Showing {pageStart}–{pageEnd} of{" "}
                                {pagination.totalDonations} donations
                            </span>

                            <div className="admin-pagination-controls">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage <= 1}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                <span>
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {selectedDonation && (
                    <div
                        className="admin-donation-modal-overlay"
                        onClick={() => setSelectedDonation(null)}
                    >
                        <div
                            className="admin-donation-modal"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="admin-donation-modal-header">
                                <div>
                                    <span>DONATION DETAILS</span>
                                    <h2>{selectedDonation.foodName || "Food Donation"}</h2>
                                </div>

                                <button
                                    onClick={() => setSelectedDonation(null)}
                                    aria-label="Close details"
                                >
                                    <X size={21} />
                                </button>
                            </div>

                            {selectedDonation.imageUrl && (
                                <img
                                    className="admin-donation-modal-image"
                                    src={selectedDonation.imageUrl}
                                    alt={selectedDonation.foodName || "Food"}
                                />
                            )}

                            <div className="admin-donation-modal-body">
                                <div className="admin-donation-detail-grid">
                                    <div>
                                        <span>Category</span>
                                        <strong>{selectedDonation.category || "Other"}</strong>
                                    </div>

                                    <div>
                                        <span>Quantity</span>
                                        <strong>
                                            {selectedDonation.quantity || 0}{" "}
                                            {selectedDonation.unit || ""}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Status</span>
                                        <strong>
                                            {String(selectedDonation.status || "UNKNOWN")
                                                .replaceAll("_", " ")}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Preparation Time</span>
                                        <strong>
                                            {formatDate(selectedDonation.preparationTime)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Expiry Time</span>
                                        <strong>
                                            {formatDate(selectedDonation.expiryTime)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Collection Deadline</span>
                                        <strong>
                                            {formatDate(selectedDonation.collectionDeadline)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="admin-donation-detail-section">
                                    <h3>Donor Information</h3>
                                    <p>{getDonorName(selectedDonation)}</p>
                                    <p>{selectedDonation.donor?.email || "No email available"}</p>
                                    <p>{selectedDonation.donor?.phone || "No phone available"}</p>
                                </div>

                                <div className="admin-donation-detail-section">
                                    <h3>NGO Information</h3>
                                    <p>{getNgoName(selectedDonation)}</p>
                                    <p>{selectedDonation.ngo?.email || "No NGO email available"}</p>
                                </div>

                                <div className="admin-donation-detail-section">
                                    <h3>
                                        <MapPin size={16} /> Collection Address
                                    </h3>
                                    <p>{selectedDonation.address || "No address available"}</p>
                                </div>

                                <div className="admin-donation-detail-section">
                                    <h3>Description</h3>
                                    <p>
                                        {selectedDonation.description ||
                                            "No additional description provided."}
                                    </p>
                                </div>

                                <div className="admin-donation-detail-section">
                                    <h3>Storage Instructions</h3>
                                    <p>
                                        {selectedDonation.storageInstructions ||
                                            "No storage instructions provided."}
                                    </p>
                                </div>
                            </div>

                            <div className="admin-donation-modal-footer">
                                <button onClick={() => setSelectedDonation(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminDonations;