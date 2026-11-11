import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
    LayoutDashboard,
    Utensils,
    ClipboardList,
    Bell,
    Settings,
    LogOut,
    Heart,
    Menu,
    X,
    ChevronRight,
    Users,
    ShieldCheck
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./DashboardLayout.css";

const DashboardLayout = ({ children, role = "donor" }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [mobileOpen, setMobileOpen] = useState(false);

    // ROLE CONFIGURATION
    const roleLabels = {
        donor: "Food Donor",
        ngo: "NGO Partner",
        admin: "Administrator"
    };

    const currentRole = roleLabels[role] ? role : "donor";
    const roleLabel = roleLabels[currentRole];

    // SIDEBAR NAVIGATION
    const navItems = [
        {
            label: "Overview",
            path: `/${currentRole}/dashboard`,
            icon: LayoutDashboard
        },

        ...(currentRole === "donor"
            ? [
                {
                    label: "Create Donation",
                    path: "/donor/donations/new",
                    icon: Utensils
                },
                {
                    label: "My Donations",
                    path: "/donor/donations",
                    icon: ClipboardList
                }
            ]
            : currentRole === "ngo"
                ? [
                    {
                        label: "Available Donations",
                        path: "/ngo/donations",
                        icon: ClipboardList
                    },
                    {
                        label: "My Collections",
                        path: "/ngo/collections",
                        icon: Utensils
                    },
                    {
                        label: "NGO Profile",
                        path: "/ngo/profile",
                        icon: Settings
                    }
                ]
                : [
                    {
                        label: "NGO Verification",
                        path: "/admin/ngos",
                        icon: ShieldCheck
                    },
                    {
                        label: "Manage Users",
                        path: "/admin/users",
                        icon: Users
                    },
                    {
                        label: "Manage Donations",
                        path: "/admin/donations",
                        icon: ClipboardList
                    }
                ]
        ),

        {
            label: "Notifications",
            path: `/${currentRole}/notifications`,
            icon: Bell
        },

        ...(currentRole === "donor"
            ? [
                {
                    label: "Settings",
                    path: "/donor/settings",
                    icon: Settings
                }
            ]
            : [])
    ];

    // LOGOUT
    const handleLogout = () => {
        logout();
        setMobileOpen(false);

        navigate("/login", {
            replace: true
        });
    };

    // MOBILE SIDEBAR
    const closeMobile = () => {
        setMobileOpen(false);
    };

    // USER DETAILS
    const userName = user?.name || "User";

    const userInitial = userName
        .trim()
        .charAt(0)
        .toUpperCase() || "U";

    // UI
    return (
        <div className="dashboard-layout">

            {/* MOBILE OVERLAY */}

            {mobileOpen && (
                <button
                    type="button"
                    className="sidebar-overlay"
                    aria-label="Close navigation menu"
                    onClick={closeMobile}
                />
            )}

            {/* SIDEBAR */}

            <aside
                className={`dashboard-sidebar ${
                    mobileOpen ? "sidebar-open" : ""
                }`}
            >

                {/* BRAND */}

                <div className="sidebar-brand">

                    <div className="brand-icon">
                        <Heart size={22} fill="white" />
                    </div>

                    <span>
                        Food
                        <span className="brand-highlight">
                            Bridge
                        </span>
                    </span>

                    <button
                        type="button"
                        className="sidebar-close"
                        onClick={closeMobile}
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* USER PROFILE */}

                <div className="sidebar-user">

                    <div className="user-avatar">
                        {userInitial}
                    </div>

                    <div className="sidebar-user-info">
                        <strong>{userName}</strong>
                        <span>{roleLabel}</span>
                    </div>

                </div>

                {/* NAVIGATION LABEL */}

                <p className="sidebar-section-label">
                    WORKSPACE
                </p>

                {/* NAVIGATION LINKS */}

                <nav
                    className="sidebar-navigation"
                    aria-label="Main navigation"
                >

                    {navItems.map((item) => {

                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end
                                className={({ isActive }) =>
                                    `sidebar-link ${
                                        isActive ? "active" : ""
                                    }`
                                }
                                onClick={closeMobile}
                            >

                                <Icon size={19} />

                                <span>
                                    {item.label}
                                </span>

                                <ChevronRight
                                    size={15}
                                    className="sidebar-link-arrow"
                                />

                            </NavLink>
                        );
                    })}

                </nav>

                {/* SIDEBAR BOTTOM */}

                <div className="sidebar-bottom">

                    <div className="sidebar-help-card">

                        <div className="help-icon">
                            <Heart size={20} />
                        </div>

                        <strong>
                            Make an impact!
                        </strong>

                        <p>
                            Every meal shared makes a difference.
                        </p>

                    </div>

                    {/* LOGOUT */}

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >

                        <LogOut size={19} />

                        <span>
                            Sign out
                        </span>

                    </button>

                </div>

            </aside>

            {/* MAIN CONTENT */}

            <main className="dashboard-main">

                {/* TOP NAVBAR */}

                <header className="dashboard-topbar">

                    <button
                        type="button"
                        className="mobile-menu-button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation menu"
                    >
                        <Menu size={23} />
                    </button>

                    <div className="topbar-heading">

                        <span>
                            FoodBridge
                        </span>

                        <span className="topbar-separator">
                            /
                        </span>

                        <span>
                            {roleLabel}
                        </span>

                    </div>

                    {/* PROFILE */}

                    <div className="topbar-profile">

                        <div className="topbar-avatar">
                            {userInitial}
                        </div>

                        <div className="topbar-profile-info">

                            <strong>
                                {userName}
                            </strong>

                            <span>
                                {roleLabel}
                            </span>

                        </div>

                    </div>

                </header>

                {/* PAGE CONTENT */}

                <section className="dashboard-content">
                    {children}
                </section>

            </main>

        </div>
    );
};

export default DashboardLayout;