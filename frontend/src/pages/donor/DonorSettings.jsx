
import React, { useEffect, useState } from "react";
import {
    Settings,
    UserRound,
    LockKeyhole,
    Bell,
    ShieldCheck,
    ArrowLeft,
    Save,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Mail,
    Phone,
    MapPin,
    CalendarDays,
    LogOut
} from "lucide-react";

import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import "./DonorSettings.css";

const DonorSettings = () => {
    const { user, logout } = useAuth();

    const [activeSection, setActiveSection] = useState("profile");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [profile, setProfile] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        address: user?.address || ""
    });

    const [password, setPassword] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [preferences, setPreferences] = useState(() => {
        try {
            const saved = localStorage.getItem("donorNotificationPreferences");

            return saved
                ? JSON.parse(saved)
                : {
                    donationAlerts: true,
                    acceptanceAlerts: true,
                    expiryReminders: true,
                    collectionReminders: true
                };
        } catch {
            return {
                donationAlerts: true,
                acceptanceAlerts: true,
                expiryReminders: true,
                collectionReminders: true
            };
        }
    });

    useEffect(() => {
        setProfile({
            name: user?.name || "",
            phone: user?.phone || "",
            address: user?.address || ""
        });
    }, [user]);

    const sections = [
        {
            id: "profile",
            title: "Profile Settings",
            description: "Manage your personal information",
            icon: UserRound
        },
        {
            id: "password",
            title: "Change Password",
            description: "Update your account password",
            icon: LockKeyhole
        },
        {
            id: "notifications",
            title: "Notifications",
            description: "Manage your donation alerts",
            icon: Bell
        },
        {
            id: "privacy",
            title: "Privacy & Security",
            description: "Review your account information",
            icon: ShieldCheck
        }
    ];

    const clearMessages = () => {
        setMessage("");
        setError("");
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
        clearMessages();
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        clearMessages();

        if (!profile.name.trim()) {
            setError("Please enter your name.");
            return;
        }

        if (!profile.phone.trim()) {
            setError("Please enter your phone number.");
            return;
        }

        if (!/^\d{10}$/.test(profile.phone.trim())) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }

        if (!profile.address.trim()) {
            setError("Please enter your address.");
            return;
        }

        setSaving(true);

        try {
            const response = await API.put("/profile/update", {
                name: profile.name.trim(),
                phone: profile.phone.trim(),
                address: profile.address.trim()
            });

            const updatedUser =
                response.data?.user ||
                response.data?.data?.user ||
                response.data?.data ||
                response.data;

            const currentUser = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            const mergedUser = {
                ...currentUser,
                ...(updatedUser && typeof updatedUser === "object"
                    ? updatedUser
                    : {}),
                name: profile.name.trim(),
                phone: profile.phone.trim(),
                address: profile.address.trim()
            };

            localStorage.setItem("user", JSON.stringify(mergedUser));

            setMessage("Your profile has been updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;

        setPassword((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        clearMessages();

        if (
            !password.currentPassword ||
            !password.newPassword ||
            !password.confirmPassword
        ) {
            setError("Please fill in all password fields.");
            return;
        }

        if (password.newPassword.length < 8) {
            setError("New password must contain at least 8 characters.");
            return;
        }

        if (password.newPassword !== password.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        if (password.currentPassword === password.newPassword) {
            setError("New password must be different from current password.");
            return;
        }

        setSaving(true);

        try {
            await API.put("/profile/change-password", {
                currentPassword: password.currentPassword,
                newPassword: password.newPassword
            });

            setPassword({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            setMessage("Your password has been changed successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to change password. Please check your current password."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePreferenceChange = (key) => {
        setPreferences((previous) => {
            const updated = {
                ...previous,
                [key]: !previous[key]
            };

            localStorage.setItem(
                "donorNotificationPreferences",
                JSON.stringify(updated)
            );

            return updated;
        });

        setMessage("Notification preferences saved on this device.");
        setError("");
    };

    const renderProfile = () => (
        <div className="settings-panel">
            <div className="panel-heading">
                <div className="panel-icon">
                    <UserRound size={23} />
                </div>

                <div>
                    <h2>Personal Information</h2>
                    <p>Update your donor profile details.</p>
                </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
                <div className="settings-form-grid">
                    <div className="settings-field">
                        <label>Full Name</label>
                        <div className="settings-input-wrapper">
                            <UserRound size={18} />
                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleProfileChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                    </div>

                    <div className="settings-field">
                        <label>Email Address</label>
                        <div className="settings-input-wrapper disabled-input">
                            <Mail size={18} />
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                            />
                        </div>
                        <small>Email address cannot be changed here.</small>
                    </div>

                    <div className="settings-field">
                        <label>Phone Number</label>
                        <div className="settings-input-wrapper">
                            <Phone size={18} />
                            <input
                                type="tel"
                                name="phone"
                                value={profile.phone}
                                onChange={handleProfileChange}
                                placeholder="Enter 10-digit phone number"
                                maxLength={10}
                                required
                            />
                        </div>
                    </div>

                    <div className="settings-field full-width">
                        <label>Address</label>
                        <div className="settings-input-wrapper address-input">
                            <MapPin size={18} />
                            <textarea
                                name="address"
                                value={profile.address}
                                onChange={handleProfileChange}
                                placeholder="Enter your complete address"
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="settings-form-actions">
                    <button
                        type="submit"
                        className="settings-save-btn"
                        disabled={saving}
                    >
                        <Save size={17} />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderPassword = () => (
        <div className="settings-panel">
            <div className="panel-heading">
                <div className="panel-icon">
                    <LockKeyhole size={23} />
                </div>

                <div>
                    <h2>Change Password</h2>
                    <p>Choose a strong password for your account.</p>
                </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
                <div className="password-form">
                    <div className="settings-field">
                        <label>Current Password</label>
                        <div className="settings-input-wrapper">
                            <LockKeyhole size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="currentPassword"
                                value={password.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="Enter current password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="settings-field">
                        <label>New Password</label>
                        <div className="settings-input-wrapper">
                            <LockKeyhole size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="newPassword"
                                value={password.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                    </div>

                    <div className="settings-field">
                        <label>Confirm New Password</label>
                        <div className="settings-input-wrapper">
                            <LockKeyhole size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={password.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>
                    </div>

                    <p className="password-hint">
                        Your new password must contain at least 8 characters.
                    </p>
                </div>

                <div className="settings-form-actions">
                    <button
                        type="submit"
                        className="settings-save-btn"
                        disabled={saving}
                    >
                        <LockKeyhole size={17} />
                        {saving ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </form>
        </div>
    );

    const notificationItems = [
        {
            key: "donationAlerts",
            title: "New Donation Alerts",
            description: "Receive updates about your food donations."
        },
        {
            key: "acceptanceAlerts",
            title: "NGO Acceptance Alerts",
            description: "Know when an NGO accepts your donation."
        },
        {
            key: "expiryReminders",
            title: "Food Expiry Reminders",
            description: "Receive reminders before food expires."
        },
        {
            key: "collectionReminders",
            title: "Collection Reminders",
            description: "Get notified about upcoming collection deadlines."
        }
    ];

    const renderNotifications = () => (
        <div className="settings-panel">
            <div className="panel-heading">
                <div className="panel-icon">
                    <Bell size={23} />
                </div>

                <div>
                    <h2>Notification Preferences</h2>
                    <p>Choose the notifications you want to receive.</p>
                </div>
            </div>

            <div className="notification-settings-list">
                {notificationItems.map((item) => (
                    <div className="notification-setting-row" key={item.key}>
                        <div>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>

                        <label className="settings-switch">
                            <input
                                type="checkbox"
                                checked={Boolean(preferences[item.key])}
                                onChange={() => handlePreferenceChange(item.key)}
                            />
                            <span className="settings-switch-slider"></span>
                        </label>
                    </div>
                ))}
            </div>

            <div className="preference-note">
                <Bell size={17} />
                <span>
                    Your choices are currently saved in this browser.
                    Server-side notification preferences are not yet connected.
                </span>
            </div>
        </div>
    );

    const renderPrivacy = () => (
        <div className="settings-panel">
            <div className="panel-heading">
                <div className="panel-icon">
                    <ShieldCheck size={23} />
                </div>

                <div>
                    <h2>Privacy & Security</h2>
                    <p>Review your account and security information.</p>
                </div>
            </div>

            <div className="security-info-list">
                <div className="security-info-row">
                    <div className="security-info-icon">
                        <UserRound size={19} />
                    </div>
                    <div>
                        <span>Account Name</span>
                        <strong>{user?.name || "Not available"}</strong>
                    </div>
                </div>

                <div className="security-info-row">
                    <div className="security-info-icon">
                        <Mail size={19} />
                    </div>
                    <div>
                        <span>Email Address</span>
                        <strong>{user?.email || "Not available"}</strong>
                    </div>
                </div>

                <div className="security-info-row">
                    <div className="security-info-icon">
                        <ShieldCheck size={19} />
                    </div>
                    <div>
                        <span>Account Role</span>
                        <strong>{user?.role || "Donor"}</strong>
                    </div>
                </div>

                <div className="security-info-row">
                    <div className="security-info-icon">
                        <CheckCircle2 size={19} />
                    </div>
                    <div>
                        <span>Account Status</span>
                        <strong className="account-active">
                            {user?.isActive === false ? "Inactive" : "Active"}
                        </strong>
                    </div>
                </div>

                <div className="security-info-row">
                    <div className="security-info-icon">
                        <CalendarDays size={19} />
                    </div>
                    <div>
                        <span>Registered On</span>
                        <strong>
                            {user?.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "Not available"}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="security-warning">
                <ShieldCheck size={20} />
                <div>
                    <strong>Keep your account secure</strong>
                    <p>
                        Never share your password or login credentials
                        with anyone.
                    </p>
                </div>
            </div>

            <button
                type="button"
                className="settings-logout-btn"
                onClick={() => {
                    logout();
                    window.location.href = "/login";
                }}
            >
                <LogOut size={18} />
                Sign Out
            </button>
        </div>
    );

    const renderActiveSection = () => {
        switch (activeSection) {
            case "profile":
                return renderProfile();
            case "password":
                return renderPassword();
            case "notifications":
                return renderNotifications();
            case "privacy":
                return renderPrivacy();
            default:
                return renderProfile();
        }
    };

    return (
        <DashboardLayout role="donor">
            <div className="donor-settings-page">
                <div className="settings-heading">
                    <div>
                        <div className="settings-title-row">
                            <Settings size={27} />
                            <h1>Settings</h1>
                        </div>
                        <p>
                            Manage your account preferences and security.
                        </p>
                    </div>
                </div>

                {(message || error) && (
                    <div className={`settings-message ${error ? "error" : "success"}`}>
                        {error ? (
                            <AlertCircle size={19} />
                        ) : (
                            <CheckCircle2 size={19} />
                        )}
                        <span>{error || message}</span>
                    </div>
                )}

                <div className="settings-layout">
                    <aside className="settings-menu">
                        <div className="settings-menu-heading">
                            <span>ACCOUNT SETTINGS</span>
                        </div>

                        {sections.map((section) => {
                            const Icon = section.icon;

                            return (
                                <button
                                    type="button"
                                    key={section.id}
                                    className={`settings-menu-item ${
                                        activeSection === section.id ? "active" : ""
                                    }`}
                                    onClick={() => handleSectionChange(section.id)}
                                >
                                    <span className="settings-menu-icon">
                                        <Icon size={20} />
                                    </span>

                                    <span className="settings-menu-text">
                                        <strong>{section.title}</strong>
                                        <small>{section.description}</small>
                                    </span>
                                </button>
                            );
                        })}
                    </aside>

                    <main className="settings-content">
                        {renderActiveSection()}
                    </main>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DonorSettings;
