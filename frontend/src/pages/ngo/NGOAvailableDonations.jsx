
import React, { useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    MapPin,
    Clock,
    Package,
    Utensils,
    AlertCircle,
    Eye,
    Filter
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./NGOAvailableDonations.css";

const extractList = (response) => {
    const data = response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.donations)) return data.donations;
    if (Array.isArray(data?.data?.donations)) return data.data.donations;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const formatDate = (date) => {
    if (!date) return "Not specified";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not specified";
    }

    return parsedDate.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getAddress = (donation) => {
    if (typeof donation.address === "string") {
        return donation.address;
    }

    if (typeof donation.pickupLocation === "string") {
        return donation.pickupLocation;
    }

    if (donation.pickupLocation?.address) {
        return donation.pickupLocation.address;
    }

    return "Location not provided";
};

const NGOAvailableDonations = () => {
    const navigate = useNavigate();

    const [donations, setDonations] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDonations = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/donations/available");

            setDonations(extractList(response));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load available donations. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonations();
    }, []);

    const filteredDonations = useMemo(() => {
        return donations.filter((donation) => {
            const matchesSearch = [
                donation.foodName,
                donation.category,
                getAddress(donation)
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchesCategory =
                category === "All" ||
                donation.category?.toLowerCase() === category.toLowerCase();

            return matchesSearch && matchesCategory;
        });
    }, [donations, search, category]);

    return (
        <DashboardLayout role="ngo">
            <div className="ngo-available-page">

                <div className="available-header">
                    <div>
                        <span className="available-eyebrow">
                            FOOD DISCOVERY
                        </span>

                        <h1>Available Donations</h1>

                        <p>
                            Discover food donations shared by donors
                            and help deliver them to people in need.
                        </p>
                    </div>

                    <button
                        className="available-refresh-btn"
                        onClick={fetchDonations}
                        disabled={loading}
                    >
                        <RefreshCw size={17} />
                        Refresh
                    </button>
                </div>

                <div className="available-summary">
                    <div className="available-summary-icon">
                        <Package size={25} />
                    </div>

                    <div>
                        <span>Available food donations</span>
                        <h2>{donations.length}</h2>
                    </div>
                </div>

                <div className="available-filter-panel">
                    <div className="available-search">
                        <Search size={19} />

                        <input
                            type="text"
                            placeholder="Search food or location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="available-category">
                        <Filter size={17} />

                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Non-Vegetarian">
                                Non-Vegetarian
                            </option>
                            <option value="Bakery">Bakery</option>
                            <option value="Fruits">Fruits</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="available-error">
                        <AlertCircle size={19} />
                        <span>{error}</span>

                        <button onClick={fetchDonations}>
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="available-state">
                        <RefreshCw className="available-loader" size={30} />
                        <h3>Loading donations...</h3>
                        <p>Please wait while we find available food.</p>
                    </div>
                ) : filteredDonations.length === 0 ? (
                    <div className="available-state">
                        <div className="available-empty-icon">
                            <Utensils size={34} />
                        </div>

                        <h3>No donations found</h3>

                        <p>
                            {donations.length === 0
                                ? "There are currently no available donations."
                                : "Try changing your search or category filter."}
                        </p>

                        {(search || category !== "All") && (
                            <button
                                className="available-clear-btn"
                                onClick={() => {
                                    setSearch("");
                                    setCategory("All");
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="available-donation-grid">
                        {filteredDonations.map((donation) => (
                            <article
                                className="available-donation-card"
                                key={donation._id || donation.id}
                            >
                                <div className="available-card-image">
                                    {donation.imageUrl ? (
                                        <img
                                            src={donation.imageUrl}
                                            alt={donation.foodName || "Food"}
                                        />
                                    ) : (
                                        <div className="available-image-placeholder">
                                            <Utensils size={38} />
                                            <span>Food Donation</span>
                                        </div>
                                    )}

                                    <span className="available-status">
                                        Available
                                    </span>
                                </div>

                                <div className="available-card-content">
                                    <div className="available-card-heading">
                                        <span className="available-category-tag">
                                            {donation.category || "Other"}
                                        </span>

                                        <h3>
                                            {donation.foodName || "Food Donation"}
                                        </h3>
                                    </div>

                                    <div className="available-info-row">
                                        <Package size={17} />
                                        <span>
                                            Quantity:{" "}
                                            <strong>
                                                {donation.quantity ?? "N/A"}{" "}
                                                {donation.unit || ""}
                                            </strong>
                                        </span>
                                    </div>

                                    <div className="available-info-row">
                                        <MapPin size={17} />
                                        <span>{getAddress(donation)}</span>
                                    </div>

                                    <div className="available-info-row">
                                        <Clock size={17} />
                                        <span>
                                            Expires:{" "}
                                            {formatDate(donation.expiryTime)}
                                        </span>
                                    </div>

                                    <button
                                        className="available-view-btn"
                                        onClick={() =>
                                            navigate(
                                                `/ngo/donations/${donation._id || donation.id}`
                                            )
                                        }
                                        disabled={!donation._id && !donation.id}
                                    >
                                        <Eye size={17} />
                                        View Donation Details
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default NGOAvailableDonations;
