
import React, { useEffect, useState } from "react";
import {
    Plus,
    Package,
    Clock,
    CheckCircle2,
    Truck,
    RefreshCw,
    ArrowUpRight,
    Utensils,
    CalendarDays
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import API from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./DonorDashboard.css";

const DonorDashboard = () => {
    const navigate = useNavigate();

    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDonations = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/donations/my");
            const result = response.data;

            const list =
                Array.isArray(result) ? result :
                Array.isArray(result.donations) ? result.donations :
                Array.isArray(result.data?.donations) ? result.data.donations :
                Array.isArray(result.data) ? result.data : [];

            setDonations(list);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your donations. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDonations();
    }, []);

    const countStatus = (status) =>
        donations.filter(
            (donation) => donation.status?.toUpperCase() === status
        ).length;

    const total = donations.length;
    const active = countStatus("AVAILABLE") + countStatus("ACCEPTED");
    const completed = countStatus("COMPLETED");
    const pickedUp = countStatus("PICKED_UP");

    const getStatusClass = (status) => {
        const value = status?.toLowerCase().replaceAll("_", "-");
        return `donation-status status-${value || "unknown"}`;
    };

    const formatDate = (date) => {
        if (!date) return "Not specified";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) return "Not specified";

        return parsed.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <DashboardLayout role="donor">
            <div className="donor-dashboard">
                <section className="donor-welcome">
                    <div>
                        <span className="welcome-tag">DONOR WORKSPACE</span>
                        <h1>Welcome back! 👋</h1>
                        <p>
                            Your generosity can turn surplus food into
                            someone's next meal. Here's your activity.
                        </p>
                    </div>

                    <button
                        className="donor-create-button"
                        onClick={() => navigate("/donor/donations/new")}
                    >
                        <Plus size={19} />
                        Create Donation
                    </button>
                </section>

                <section className="donor-stats-grid">
                    <div className="donor-stat-card">
                        <div className="stat-icon stat-icon-green">
                            <Package size={22} />
                        </div>
                        <span>Total Donations</span>
                        <strong>{loading ? "—" : total}</strong>
                        <small>All donations submitted</small>
                    </div>

                    <div className="donor-stat-card">
                        <div className="stat-icon stat-icon-orange">
                            <Clock size={22} />
                        </div>
                        <span>Active Donations</span>
                        <strong>{loading ? "—" : active}</strong>
                        <small>Available or accepted</small>
                    </div>

                    <div className="donor-stat-card">
                        <div className="stat-icon stat-icon-blue">
                            <Truck size={22} />
                        </div>
                        <span>Picked Up</span>
                        <strong>{loading ? "—" : pickedUp}</strong>
                        <small>Collected by an NGO</small>
                    </div>

                    <div className="donor-stat-card">
                        <div className="stat-icon stat-icon-purple">
                            <CheckCircle2 size={22} />
                        </div>
                        <span>Completed</span>
                        <strong>{loading ? "—" : completed}</strong>
                        <small>Successfully completed</small>
                    </div>
                </section>

                <section className="donor-impact-card">
                    <div className="impact-icon">
                        <Utensils size={25} />
                    </div>
                    <div className="impact-content">
                        <span>YOUR COMMUNITY IMPACT</span>
                        <h2>Every donation makes a difference.</h2>
                        <p>
                            Thank you for helping good food reach people
                            who need it. Keep sharing and inspiring others.
                        </p>
                    </div>
                    <div className="impact-total">
                        <strong>{loading ? "—" : completed}</strong>
                        <span>Completed donations</span>
                    </div>
                </section>

                <section className="donor-history-card">
                    <div className="donor-section-heading">
                        <div>
                            <h2>Recent Donations</h2>
                            <p>Track the status of your food donations.</p>
                        </div>

                        <button
                            className="donor-refresh-button"
                            onClick={loadDonations}
                            disabled={loading}
                            aria-label="Refresh donations"
                        >
                            <RefreshCw size={17} />
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div className="donor-error">
                            {error}
                            <button onClick={loadDonations}>Try again</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="donor-empty-state">
                            <RefreshCw className="donor-loading-icon" size={27} />
                            <p>Loading your donations...</p>
                        </div>
                    ) : !error && donations.length === 0 ? (
                        <div className="donor-empty-state">
                            <div className="empty-icon">
                                <Utensils size={27} />
                            </div>
                            <h3>No donations yet</h3>
                            <p>
                                Start making a difference by sharing your
                                surplus food with someone in need.
                            </p>
                            <button
                                className="donor-create-button"
                                onClick={() => navigate("/donor/donations/new")}
                            >
                                <Plus size={18} />
                                Create your first donation
                            </button>
                        </div>
                    ) : !error ? (
                        <div className="donor-table-wrapper">
                            <table className="donor-table">
                                <thead>
                                    <tr>
                                        <th>Food Details</th>
                                        <th>Quantity</th>
                                        <th>Expiry Date</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {donations.slice(0, 8).map((donation) => (
                                        <tr key={donation._id}>
                                            <td>
                                                <div className="donor-food-cell">
                                                    <div className="food-row-icon">
                                                        <Utensils size={17} />
                                                    </div>
                                                    <div>
                                                        <strong>{donation.foodName || "Food donation"}</strong>
                                                        <span>{donation.category || "General"}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {donation.quantity ?? "—"}{" "}
                                                {donation.unit || ""}
                                            </td>

                                            <td>
                                                <span className="donor-date">
                                                    <CalendarDays size={14} />
                                                    {formatDate(donation.expiryTime)}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={getStatusClass(donation.status)}>
                                                    {(donation.status || "UNKNOWN").replaceAll("_", " ")}
                                                </span>
                                            </td>

                                            <td>{formatDate(donation.createdAt)}</td>

                                            <td>
                                                <button
                                                    className="donor-view-button"
                                                    title="View donation"
                                                    onClick={() =>
                                                        navigate(`/donor/donations/${donation._id}`)
                                                    }
                                                >
                                                    <ArrowUpRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </section>

                <p className="donor-footer-note">
                    Thank you for being part of a community that cares. 💚
                </p>
            </div>
        </DashboardLayout>
    );
};

export default DonorDashboard;
