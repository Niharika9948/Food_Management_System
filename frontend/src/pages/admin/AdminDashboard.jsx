import React, { useEffect, useState } from "react";
import {
    Users,
    Heart,
    Building2,
    ShieldCheck,
    Clock,
    Package,
    CheckCircle,
    Truck,
    XCircle,
    RefreshCw,
    AlertCircle,
    ArrowRight
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./AdminDashboard.css";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/admin/dashboard");

            if (response.data.success) {
                setStats(response.data.stats);
            } else {
                setError("Unable to load dashboard statistics.");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const userStats = stats?.users || {};
    const donationStats = stats?.donations || {};

    const userCards = [
        {
            title: "Total Users",
            value: userStats.total ?? 0,
            icon: Users,
            color: "blue",
            description: "Registered platform users"
        },
        {
            title: "Total Donors",
            value: userStats.donors ?? 0,
            icon: Heart,
            color: "pink",
            description: "People sharing food"
        },
        {
            title: "Total NGOs",
            value: userStats.ngos ?? 0,
            icon: Building2,
            color: "purple",
            description: "Registered organizations"
        },
        {
            title: "Verified NGOs",
            value: userStats.verifiedNgos ?? 0,
            icon: ShieldCheck,
            color: "green",
            description: "Approved organizations"
        }
    ];

    const donationCards = [
        {
            title: "Available",
            value: donationStats.available ?? 0,
            icon: Package,
            color: "blue"
        },
        {
            title: "Accepted",
            value: donationStats.accepted ?? 0,
            icon: CheckCircle,
            color: "purple"
        },
        {
            title: "Picked Up",
            value: donationStats.pickedUp ?? 0,
            icon: Truck,
            color: "orange"
        },
        {
            title: "Completed",
            value: donationStats.completed ?? 0,
            icon: Heart,
            color: "green"
        },
        {
            title: "Expired",
            value: donationStats.expired ?? 0,
            icon: Clock,
            color: "yellow"
        },
        {
            title: "Cancelled",
            value: donationStats.cancelled ?? 0,
            icon: XCircle,
            color: "red"
        }
    ];

    const quickActions = [
        {
            title: "Verify NGOs",
            description: "Review organizations waiting for approval.",
            icon: ShieldCheck,
            path: "/admin/ngos",
            color: "green",
            count: userStats.pendingNgos ?? 0
        },
        {
            title: "Manage Users",
            description: "View and manage donor and NGO accounts.",
            icon: Users,
            path: "/admin/users",
            color: "blue"
        },
        {
            title: "Manage Donations",
            description: "Monitor all food donation activities.",
            icon: Package,
            path: "/admin/donations",
            color: "orange"
        }
    ];

    return (
        <DashboardLayout role="admin">
            <div className="admin-dashboard-page">

                {/* Page Heading */}
                <div className="admin-page-heading">
                    <div>
                        <span className="admin-eyebrow">
                            ADMIN CONTROL CENTER
                        </span>

                        <h1>Admin Dashboard</h1>

                        <p>
                            Monitor users, NGO verification and food donation
                            activities from one place.
                        </p>
                    </div>

                    <button
                        className="admin-refresh-button"
                        onClick={fetchStats}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={17}
                            className={loading ? "admin-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="admin-error-message">
                        <AlertCircle size={19} />
                        <span>{error}</span>
                        <button onClick={fetchStats}>Retry</button>
                    </div>
                )}

                {loading && !stats ? (
                    <div className="admin-loading">
                        <div className="admin-loader"></div>
                        <p>Loading dashboard statistics...</p>
                    </div>
                ) : (
                    <>
                        {/* Pending Verification Banner */}
                        <div className="admin-pending-banner">
                            <div className="admin-pending-icon">
                                <Clock size={25} />
                            </div>

                            <div className="admin-pending-content">
                                <h3>
                                    NGO Verification Requests
                                </h3>
                                <p>
                                    {userStats.pendingNgos ?? 0} organizations
                                    are waiting for verification.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate("/admin/ngos")}
                            >
                                Review NGOs
                                <ArrowRight size={17} />
                            </button>
                        </div>

                        {/* User Statistics */}
                        <section className="admin-stats-section">
                            <div className="admin-section-heading">
                                <div>
                                    <h2>Platform Overview</h2>
                                    <p>Overall registered user statistics</p>
                                </div>
                            </div>

                            <div className="admin-user-stats-grid">
                                {userCards.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            className="admin-stat-card"
                                            key={item.title}
                                        >
                                            <div className={`admin-stat-icon ${item.color}`}>
                                                <Icon size={22} />
                                            </div>

                                            <div className="admin-stat-info">
                                                <span>{item.title}</span>
                                                <h3>
                                                    {loading
                                                        ? "..."
                                                        : item.value.toLocaleString("en-IN")}
                                                </h3>
                                                <small>{item.description}</small>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Donation Statistics */}
                        <section className="admin-stats-section">
                            <div className="admin-section-heading">
                                <div>
                                    <h2>Donation Overview</h2>
                                    <p>
                                        Track the current status of all food
                                        donations.
                                    </p>
                                </div>

                                <span className="admin-total-badge">
                                    Total: {donationStats.total ?? 0}
                                </span>
                            </div>

                            <div className="admin-donation-stats-grid">
                                {donationCards.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            className="admin-donation-card"
                                            key={item.title}
                                        >
                                            <div className={`admin-donation-icon ${item.color}`}>
                                                <Icon size={21} />
                                            </div>

                                            <div>
                                                <span>{item.title}</span>
                                                <h3>
                                                    {loading
                                                        ? "..."
                                                        : item.value.toLocaleString("en-IN")}
                                                </h3>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Quick Actions */}
                        <section className="admin-actions-section">
                            <div className="admin-section-heading">
                                <div>
                                    <h2>Administration</h2>
                                    <p>Quick access to management modules</p>
                                </div>
                            </div>

                            <div className="admin-actions-grid">
                                {quickActions.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <button
                                            className="admin-action-card"
                                            key={item.title}
                                            onClick={() => navigate(item.path)}
                                        >
                                            <div className={`admin-action-icon ${item.color}`}>
                                                <Icon size={23} />
                                            </div>

                                            <div className="admin-action-text">
                                                <h3>{item.title}</h3>
                                                <p>{item.description}</p>
                                            </div>

                                            {item.count !== undefined && (
                                                <span className="admin-action-count">
                                                    {item.count}
                                                </span>
                                            )}

                                            <ArrowRight
                                                size={19}
                                                className="admin-action-arrow"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;