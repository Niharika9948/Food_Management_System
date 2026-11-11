import React, { useEffect, useMemo, useState } from "react";
import {
    Package,
    Search,
    RefreshCw,
    Clock,
    MapPin,
    CheckCircle,
    Truck,
    AlertCircle,
    LoaderCircle,
    Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import API from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./NGOMyCollections.css";

const FILTERS = ["ALL", "ACCEPTED", "PICKED_UP", "COMPLETED"];

const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Not available"
        : date.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
};

const getDonations = (response) =>
    response?.data?.donations ||
    response?.data?.data?.donations ||
    response?.data?.data ||
    response?.data ||
    [];

const NGOMyCollections = () => {
    const navigate = useNavigate();

    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await API.get("/ngo/my-donations");
            const result = getDonations(response);

            setDonations(Array.isArray(result) ? result : []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your collections."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleStatusUpdate = async (donation) => {
        const id = donation._id;

        let endpoint = "";
        let confirmation = "";

        if (donation.status === "ACCEPTED") {
            endpoint = `/ngo/pickup/${id}`;
            confirmation = "Mark this food donation as picked up?";
        } else if (donation.status === "PICKED_UP") {
            endpoint = `/ngo/complete/${id}`;
            confirmation = "Mark this donation as completed?";
        } else {
            return;
        }

        if (!window.confirm(confirmation)) return;

        try {
            setUpdatingId(id);
            setError("");
            setSuccess("");

            const response = await API.patch(endpoint);

            const updatedDonation =
                response.data?.donation ||
                response.data?.data?.donation;

            if (updatedDonation) {
                setDonations((previous) =>
                    previous.map((item) =>
                        item._id === id ? updatedDonation : item
                    )
                );
            } else {
                await fetchCollections();
            }

            setSuccess(
                response.data?.message ||
                "Donation status updated successfully."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update donation status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredDonations = useMemo(() => {
        return donations.filter((donation) => {
            const matchesFilter =
                activeFilter === "ALL" ||
                donation.status === activeFilter;

            const searchText = search.toLowerCase().trim();

            const matchesSearch =
                !searchText ||
                donation.foodName?.toLowerCase().includes(searchText) ||
                donation.category?.toLowerCase().includes(searchText) ||
                donation.address?.toLowerCase().includes(searchText) ||
                donation.donor?.name?.toLowerCase().includes(searchText);

            return matchesFilter && matchesSearch;
        });
    }, [donations, activeFilter, search]);

    const counts = {
        total: donations.length,
        accepted: donations.filter(
            (item) => item.status === "ACCEPTED"
        ).length,
        pickedUp: donations.filter(
            (item) => item.status === "PICKED_UP"
        ).length,
        completed: donations.filter(
            (item) => item.status === "COMPLETED"
        ).length
    };

    const getNextAction = (donation) => {
        if (donation.status === "ACCEPTED") {
            return "Mark as Picked Up";
        }

        if (donation.status === "PICKED_UP") {
            return "Mark as Completed";
        }

        return null;
    };

    return (
        <DashboardLayout role="ngo">
            <div className="ngo-collections-page">

                <div className="collections-heading">
                    <div>
                        <span className="collections-eyebrow">
                            NGO COLLECTION MANAGEMENT
                        </span>
                        <h1>My Collections</h1>
                        <p>
                            Track your accepted donations and manage
                            food collection progress.
                        </p>
                    </div>

                    <button
                        className="collections-refresh"
                        onClick={() => fetchCollections(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? "spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {/* Statistics */}
                <div className="collections-stats">
                    <div className="collection-stat-card">
                        <div className="collection-stat-icon green">
                            <Package size={21} />
                        </div>
                        <div>
                            <span>Total Collections</span>
                            <strong>{counts.total}</strong>
                        </div>
                    </div>

                    <div className="collection-stat-card">
                        <div className="collection-stat-icon orange">
                            <Clock size={21} />
                        </div>
                        <div>
                            <span>Accepted</span>
                            <strong>{counts.accepted}</strong>
                        </div>
                    </div>

                    <div className="collection-stat-card">
                        <div className="collection-stat-icon blue">
                            <Truck size={21} />
                        </div>
                        <div>
                            <span>Picked Up</span>
                            <strong>{counts.pickedUp}</strong>
                        </div>
                    </div>

                    <div className="collection-stat-card">
                        <div className="collection-stat-icon purple">
                            <CheckCircle size={21} />
                        </div>
                        <div>
                            <span>Completed</span>
                            <strong>{counts.completed}</strong>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="collections-alert error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="collections-alert success">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                {/* Search and filters */}
                <div className="collections-toolbar">
                    <div className="collections-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search food, category, donor or address..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <div className="collections-filters">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter}
                                className={
                                    activeFilter === filter ? "active" : ""
                                }
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Collection cards */}
                {loading ? (
                    <div className="collections-loading">
                        <LoaderCircle className="spin" size={36} />
                        <p>Loading your collections...</p>
                    </div>
                ) : filteredDonations.length === 0 ? (
                    <div className="collections-empty">
                        <div className="collections-empty-icon">
                            <Package size={35} />
                        </div>
                        <h3>No collections found</h3>
                        <p>
                            {donations.length === 0
                                ? "When you accept a food donation, it will appear here."
                                : "Try changing your search or status filter."}
                        </p>
                        {donations.length === 0 && (
                            <button
                                onClick={() => navigate("/ngo/donations")}
                            >
                                Explore Available Donations
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="collections-grid">
                        {filteredDonations.map((donation) => {
                            const donor =
                                typeof donation.donor === "object"
                                    ? donation.donor
                                    : {};

                            const action = getNextAction(donation);
                            const isUpdating =
                                updatingId === donation._id;

                            return (
                                <article
                                    className="collection-card"
                                    key={donation._id}
                                >
                                    <div className="collection-card-image">
                                        {donation.imageUrl ? (
                                            <img
                                                src={donation.imageUrl}
                                                alt={donation.foodName}
                                            />
                                        ) : (
                                            <div className="collection-image-placeholder">
                                                <Package size={34} />
                                                <span>Food Donation</span>
                                            </div>
                                        )}

                                        <span
                                            className={`collection-status ${donation.status?.toLowerCase()}`}
                                        >
                                            {donation.status?.replace("_", " ")}
                                        </span>
                                    </div>

                                    <div className="collection-card-body">
                                        <div className="collection-card-title">
                                            <div>
                                                <span>{donation.category}</span>
                                                <h3>{donation.foodName}</h3>
                                            </div>
                                        </div>

                                        <div className="collection-quantity">
                                            <Package size={17} />
                                            {donation.quantity} {donation.unit}
                                        </div>

                                        <div className="collection-detail-row">
                                            <MapPin size={16} />
                                            <span>{donation.address}</span>
                                        </div>

                                        <div className="collection-detail-row">
                                            <Clock size={16} />
                                            <span>
                                                Expires: {formatDate(donation.expiryTime)}
                                            </span>
                                        </div>

                                         <div className="collection-donor">
    <span>Donor Information</span>

    <strong>
        {donor.name || "Food Donor"}
    </strong>

    <p>
        <span>Phone Number:</span>{" "}
        {donor.phone || "Phone number not available"}
    </p>

    <p>
        <span>Email:</span>{" "}
        {donor.email || "Email not available"}
    </p>
</div>

                                        <div className="collection-card-actions">
                                            <button
                                                className="collection-view-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/ngo/donations/${donation._id}`
                                                    )
                                                }
                                            >
                                                <Eye size={16} />
                                                Details
                                            </button>

                                            {action && (
                                                <button
                                                    className="collection-action-button"
                                                    onClick={() =>
                                                        handleStatusUpdate(donation)
                                                    }
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? (
                                                        <LoaderCircle
                                                            size={16}
                                                            className="spin"
                                                        />
                                                    ) : donation.status === "ACCEPTED" ? (
                                                        <Truck size={16} />
                                                    ) : (
                                                        <CheckCircle size={16} />
                                                    )}

                                                    {isUpdating
                                                        ? "Updating..."
                                                        : action}
                                                </button>
                                            )}

                                            {donation.status === "COMPLETED" && (
                                                <span className="collection-completed-label">
                                                    <CheckCircle size={16} />
                                                    Successfully Completed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default NGOMyCollections;