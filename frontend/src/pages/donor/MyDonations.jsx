
import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Plus,
    Utensils,
    MapPin,
    CalendarDays,
    Package,
    RefreshCw,
    AlertCircle,
    Inbox,
    Image as ImageIcon
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import API from "../../services/api";
import "./MyDonations.css";

const getDonationsFromResponse = (response) => {
    const data = response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.donations)) return data.donations;
    if (Array.isArray(data?.data?.donations)) return data.data.donations;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const getDonationImage = (donation) => {
    if (
        Array.isArray(donation.images) &&
        donation.images.length > 0
    ) {
        const firstImage = donation.images[0];

        if (typeof firstImage === "string") {
            return firstImage;
        }

        if (firstImage?.url) {
            return firstImage.url;
        }
    }

    return donation.imageUrl || "";
};

const formatDate = (date) => {
    if (!date) return "Not provided";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not provided";
    }

    return parsedDate.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getStatusClass = (status = "") => {
    const value = status.toLowerCase().replaceAll("_", "-");

    if (value === "available") return "available";
    if (value === "accepted") return "accepted";
    if (value === "picked-up") return "picked-up";
    if (value === "completed") return "completed";
    if (value === "expired") return "expired";
    if (value === "cancelled") return "cancelled";

    return "default";
};

const MyDonations = () => {
    const navigate = useNavigate();

    const [donations, setDonations] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDonations = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/donations/my");

            const donationList = getDonationsFromResponse(response);

            setDonations(donationList);

            console.log("My donations:", donationList);
        } catch (err) {
            console.error("My donations error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load your donations. Please check your connection and try again."
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
                donation.address,
                donation.status
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === "ALL" ||
                donation.status?.toUpperCase() === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [donations, search, statusFilter]);

    const statusOptions = [
        "ALL",
        "AVAILABLE",
        "ACCEPTED",
        "PICKED_UP",
        "COMPLETED",
        "EXPIRED",
        "CANCELLED"
    ];

    return (
        <DashboardLayout>
            <div className="my-donations-page">

                <section className="my-donations-heading">
                    <div>
                        <span className="my-donations-eyebrow">
                            DONOR WORKSPACE
                        </span>

                        <h1>My Donations</h1>

                        <p>
                            Track and manage the food donations you have shared.
                        </p>
                    </div>

                    <button
                        className="my-donations-create-btn"
                        onClick={() => navigate("/donor/donations/new")}
                    >
                        <Plus size={19} />
                        Create Donation
                    </button>
                </section>

                <section className="my-donations-summary">

                    <div className="my-donations-summary-card">
                        <div className="summary-icon total">
                            <Package size={21} />
                        </div>

                        <div>
                            <span>Total Donations</span>
                            <strong>{donations.length}</strong>
                        </div>
                    </div>

                    <div className="my-donations-summary-card">
                        <div className="summary-icon available">
                            <Utensils size={21} />
                        </div>

                        <div>
                            <span>Available</span>
                            <strong>
                                {donations.filter(
                                    (item) => item.status === "AVAILABLE"
                                ).length}
                            </strong>
                        </div>
                    </div>

                    <div className="my-donations-summary-card">
                        <div className="summary-icon completed">
                            <Package size={21} />
                        </div>

                        <div>
                            <span>Completed</span>
                            <strong>
                                {donations.filter(
                                    (item) => item.status === "COMPLETED"
                                ).length}
                            </strong>
                        </div>
                    </div>

                </section>

                <section className="my-donations-content">

                    <div className="my-donations-toolbar">
                        <div>
                            <h2>Donation History</h2>
                            <p>All your submitted food donations</p>
                        </div>

                        <button
                            className="my-donations-refresh"
                            onClick={fetchDonations}
                            disabled={loading}
                            title="Refresh donations"
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "spinning" : ""}
                            />
                            Refresh
                        </button>
                    </div>

                    <div className="my-donations-filters">

                        <div className="my-donations-search">
                            <Search size={18} />

                            <input
                                type="text"
                                placeholder="Search food, category or address..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            aria-label="Filter donations by status"
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status === "ALL"
                                        ? "All Statuses"
                                        : status.replaceAll("_", " ")}
                                </option>
                            ))}
                        </select>

                    </div>

                    {loading ? (

                        <div className="my-donations-state">
                            <div className="my-donations-loader" />
                            <p>Loading your donations...</p>
                        </div>

                    ) : error ? (

                        <div className="my-donations-state error">
                            <AlertCircle size={34} />
                            <h3>Something went wrong</h3>
                            <p>{error}</p>

                            <button onClick={fetchDonations}>
                                Try Again
                            </button>
                        </div>

                    ) : filteredDonations.length === 0 ? (

                        <div className="my-donations-state empty">
                            <div className="empty-icon">
                                <Inbox size={35} />
                            </div>

                            <h3>
                                {donations.length === 0
                                    ? "No donations yet"
                                    : "No matching donations"}
                            </h3>

                            <p>
                                {donations.length === 0
                                    ? "Start sharing surplus food with people who need it."
                                    : "Try changing your search or status filter."}
                            </p>

                            {donations.length === 0 && (
                                <button
                                    onClick={() =>
                                        navigate("/donor/donations/new")
                                    }
                                >
                                    <Plus size={18} />
                                    Create Your First Donation
                                </button>
                            )}
                        </div>

                    ) : (

                        <div className="my-donations-grid">

                            {filteredDonations.map((donation) => {
                                const imageUrl = getDonationImage(donation);

                                return (
                                    <article
                                        className="my-donation-card"
                                        key={donation._id || donation.id}
                                        onClick={() =>
                                            navigate(
                                                `/donor/donations/${donation._id || donation.id}`
                                            )
                                        }
                                        style={{ cursor: "pointer" }}
                                    >

                                        <div className="my-donation-image-wrapper">

                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={donation.foodName || "Food donation"}
                                                    className="my-donation-image"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display = "none";
                                                        event.currentTarget.nextElementSibling.style.display = "flex";
                                                    }}
                                                />
                                            ) : null}

                                            <div
                                                className="my-donation-image-placeholder"
                                                style={{
                                                    display: imageUrl ? "none" : "flex"
                                                }}
                                            >
                                                <ImageIcon size={42} />
                                                <span>No food image</span>
                                            </div>

                                            <span
                                                className={`my-donation-status ${getStatusClass(
                                                    donation.status
                                                )}`}
                                            >
                                                {(donation.status || "UNKNOWN").replaceAll("_", " ")}
                                            </span>

                                        </div>

                                        <div className="my-donation-details">

                                            <span className="my-donation-category">
                                                {donation.category || "Food"}
                                            </span>

                                            <h3>
                                                {donation.foodName || "Food donation"}
                                            </h3>

                                            <div className="my-donation-info">

                                                <span>
                                                    <Package size={15} />
                                                    {donation.quantity ?? "—"} {donation.unit || ""}
                                                </span>

                                                <span>
                                                    <CalendarDays size={15} />
                                                    Expires: {formatDate(donation.expiryTime)}
                                                </span>

                                                <span>
                                                    <MapPin size={15} />
                                                    {donation.address || "Address not provided"}
                                                </span>

                                            </div>
                                        </div>

                                        <div className="my-donation-card-footer">
                                            <span>
                                                Added: {formatDate(donation.createdAt)}
                                            </span>
                                        </div>

                                    </article>
                                );
                            })}

                        </div>
                    )}

                </section>
            </div>
        </DashboardLayout>
    );
};

export default MyDonations;
