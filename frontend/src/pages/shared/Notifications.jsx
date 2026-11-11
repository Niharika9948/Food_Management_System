import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bell,
    Check,
    CheckCheck,
    Clock,
    RefreshCw,
    Search,
    Inbox,
    Package,
    ShieldCheck,
    Heart,
    AlertCircle
} from "lucide-react";

import api from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./Notifications.css";

const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getNotificationIcon = (notification) => {
    const value = `${notification?.type || ""} ${notification?.title || ""} ${
        notification?.message || ""
    }`.toLowerCase();

    if (value.includes("donation") || value.includes("food")) {
        return <Package size={20} />;
    }

    if (value.includes("ngo") || value.includes("verif")) {
        return <ShieldCheck size={20} />;
    }

    if (value.includes("complete") || value.includes("success")) {
        return <Heart size={20} />;
    }

    if (value.includes("expire") || value.includes("cancel")) {
        return <AlertCircle size={20} />;
    }

    return <Bell size={20} />;
};

const Notifications = ({ role = "donor" }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState("");
    const [markingAll, setMarkingAll] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchNotifications = useCallback(async () => {
        try {
            setError("");

            const response = await api.get("/notifications");
            const data = response.data;

            const items = Array.isArray(data.notifications)
                ? data.notifications
                : [];

            setNotifications(items);
            setUnreadCount(
                Number.isFinite(data.unreadCount)
                    ? data.unreadCount
                    : items.filter((item) => !item.isRead).length
            );
        } catch (err) {
            console.error("Notifications fetch error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load notifications. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
    };

    const handleMarkAsRead = async (notificationId) => {
        const previousNotifications = notifications;
        const selected = notifications.find(
            (item) => item._id === notificationId
        );

        if (!selected || selected.isRead) return;

        try {
            setUpdatingId(notificationId);
            setError("");
            setSuccessMessage("");

            // Update the page immediately for a smoother experience.
            setNotifications((current) =>
                current.map((item) =>
                    item._id === notificationId
                        ? { ...item, isRead: true }
                        : item
                )
            );

            setUnreadCount((count) => Math.max(0, count - 1));

            await api.patch(`/notifications/${notificationId}/read`);

            setSuccessMessage("Notification marked as read.");
        } catch (err) {
            console.error("Mark notification as read error:", err);

            setNotifications(previousNotifications);
            setUnreadCount((count) => count + 1);

            setError(
                err.response?.data?.message ||
                "Could not mark this notification as read."
            );
        } finally {
            setUpdatingId("");
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;

        try {
            setMarkingAll(true);
            setError("");
            setSuccessMessage("");

            await api.patch("/notifications/read-all");

            setNotifications((current) =>
                current.map((item) => ({ ...item, isRead: true }))
            );

            setUnreadCount(0);
            setSuccessMessage("All notifications have been marked as read.");
        } catch (err) {
            console.error("Mark all notifications error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to mark all notifications as read."
            );
        } finally {
            setMarkingAll(false);
        }
    };

    const filteredNotifications = useMemo(() => {
        const query = search.trim().toLowerCase();

        return notifications.filter((notification) => {
            const matchesFilter =
                filter === "all" ||
                (filter === "unread" && !notification.isRead) ||
                (filter === "read" && notification.isRead);

            const searchableText = [
                notification.title,
                notification.message,
                notification.type,
                notification.donation?.foodName
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !query || searchableText.includes(query);

            return matchesFilter && matchesSearch;
        });
    }, [notifications, filter, search]);

    const roleTitle = {
        donor: "Donor Notifications",
        ngo: "NGO Notifications",
        admin: "Admin Notifications"
    };

    return (
        <DashboardLayout role={role}>
            <div className="notifications-page">

                {/* Header */}
                <div className="notifications-header">
                    <div>
                        <span className="notifications-eyebrow">
                            YOUR ACTIVITY
                        </span>

                        <h1>{roleTitle[role] || "Notifications"}</h1>

                        <p>
                            Stay updated with the latest activities and alerts.
                        </p>
                    </div>

                    <button
                        className="notifications-refresh-button"
                        onClick={handleRefresh}
                        disabled={loading || refreshing}
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? "notifications-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {/* Summary */}
                <div className="notifications-summary">
                    <div className="notifications-summary-card">
                        <div className="notifications-summary-icon total">
                            <Bell size={22} />
                        </div>

                        <div>
                            <span>Total Notifications</span>
                            <h2>{notifications.length}</h2>
                        </div>
                    </div>

                    <div className="notifications-summary-card">
                        <div className="notifications-summary-icon unread">
                            <Inbox size={22} />
                        </div>

                        <div>
                            <span>Unread Notifications</span>
                            <h2>{unreadCount}</h2>
                        </div>
                    </div>

                    <div className="notifications-summary-card">
                        <div className="notifications-summary-icon read">
                            <CheckCheck size={22} />
                        </div>

                        <div>
                            <span>Read Notifications</span>
                            <h2>{Math.max(0, notifications.length - unreadCount)}</h2>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="notifications-toolbar">
                    <div className="notifications-search">
                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div className="notifications-filters">
                        <button
                            className={filter === "all" ? "active" : ""}
                            onClick={() => setFilter("all")}
                        >
                            All
                        </button>

                        <button
                            className={filter === "unread" ? "active" : ""}
                            onClick={() => setFilter("unread")}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <span>{unreadCount}</span>
                            )}
                        </button>

                        <button
                            className={filter === "read" ? "active" : ""}
                            onClick={() => setFilter("read")}
                        >
                            Read
                        </button>
                    </div>

                    <button
                        className="notifications-mark-all"
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0 || markingAll}
                    >
                        <CheckCheck size={17} />
                        {markingAll ? "Updating..." : "Mark all as read"}
                    </button>
                </div>

                {/* Feedback */}
                {error && (
                    <div className="notifications-message error">
                        <AlertCircle size={17} />
                        <span>{error}</span>
                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {successMessage && (
                    <div className="notifications-message success">
                        <Check size={17} />
                        <span>{successMessage}</span>
                        <button onClick={() => setSuccessMessage("")}>×</button>
                    </div>
                )}

                {/* Notification list */}
                <div className="notifications-list-card">
                    <div className="notifications-list-heading">
                        <div>
                            <h2>Recent Notifications</h2>
                            <p>Your latest updates and activities</p>
                        </div>

                        <span>{filteredNotifications.length} shown</span>
                    </div>

                    {loading ? (
                        <div className="notifications-state">
                            <div className="notifications-loader" />
                            <p>Loading your notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="notifications-state">
                            <div className="notifications-empty-icon">
                                <Inbox size={32} />
                            </div>

                            <h3>
                                {notifications.length === 0
                                    ? "No notifications yet"
                                    : "No matching notifications"}
                            </h3>

                            <p>
                                {notifications.length === 0
                                    ? "Your important updates will appear here."
                                    : "Try changing your search or filter."}
                            </p>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${
                                        notification.isRead ? "is-read" : "is-unread"
                                    }`}
                                >
                                    <div className="notification-item-icon">
                                        {getNotificationIcon(notification)}
                                    </div>

                                    <div className="notification-item-content">
                                        <div className="notification-item-top">
                                            <h3>
                                                {notification.title || "FoodBridge Update"}
                                            </h3>

                                            {!notification.isRead && (
                                                <span className="notification-new-label">
                                                    NEW
                                                </span>
                                            )}
                                        </div>

                                        <p>
                                            {notification.message ||
                                                "You have a new notification."}
                                        </p>

                                        {notification.donation?.foodName && (
                                            <div className="notification-donation">
                                                <Package size={14} />
                                                {notification.donation.foodName}
                                            </div>
                                        )}

                                        <div className="notification-item-footer">
                                            <span>
                                                <Clock size={13} />
                                                {formatDate(notification.createdAt)}
                                            </span>

                                            {notification.isRead ? (
                                                <span className="notification-read-label">
                                                    <CheckCheck size={14} />
                                                    Read
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        handleMarkAsRead(notification._id)
                                                    }
                                                    disabled={
                                                        updatingId === notification._id
                                                    }
                                                >
                                                    <Check size={14} />
                                                    {updatingId === notification._id
                                                        ? "Updating..."
                                                        : "Mark as read"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Notifications;