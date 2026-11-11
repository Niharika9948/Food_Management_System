import React, { useEffect, useState } from "react";
import {
    ShieldCheck,
    Search,
    Building2,
    Mail,
    Phone,
    MapPin,
    RefreshCw,
    CheckCircle,
    Clock,
    AlertCircle,
    Users
} from "lucide-react";

import API from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./NGOVerification.css";

const NGOVerification = () => {
    const [ngos, setNgos] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // FETCH PENDING NGOS
    const fetchPendingNgos = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/admin/ngos/pending");

            setNgos(response.data.ngos || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load pending NGO registrations."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingNgos();
    }, []);

    // VERIFY NGO
    const handleVerify = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to approve this NGO?"
        );

        if (!confirmed) return;

        try {
            setApprovingId(id);
            setError("");
            setSuccess("");

            const response = await API.patch(
                `/admin/ngos/${id}/verify`
            );

            if (response.data.success) {
                setNgos((previous) =>
                    previous.filter((ngo) => ngo._id !== id)
                );

                setSuccess(
                    response.data.message ||
                    "NGO verified successfully!"
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to verify NGO. Please try again."
            );
        } finally {
            setApprovingId(null);
        }
    };

    // SEARCH
    const filteredNgos = ngos.filter((ngo) => {
        const searchValue = search.toLowerCase();

        return (
            ngo.name?.toLowerCase().includes(searchValue) ||
            ngo.email?.toLowerCase().includes(searchValue) ||
            ngo.ngoDetails?.organizationName
                ?.toLowerCase()
                .includes(searchValue) ||
            ngo.phone?.includes(searchValue)
        );
    });

    return (
        <DashboardLayout role="admin">
            <div className="ngo-verification-page">

                {/* HEADER */}

                <div className="ngo-verification-header">
                    <div>
                        <span className="ngo-admin-eyebrow">
                            ADMINISTRATION
                        </span>

                        <h1>NGO Verification</h1>

                        <p>
                            Review and approve organizations before
                            they can collect food donations.
                        </p>
                    </div>

                    <button
                        className="ngo-refresh-btn"
                        onClick={fetchPendingNgos}
                        disabled={loading}
                    >
                        <RefreshCw size={17} />
                        Refresh
                    </button>
                </div>

                {/* SUMMARY */}

                <div className="ngo-verification-summary">

                    <div className="ngo-summary-icon">
                        <Clock size={25} />
                    </div>

                    <div>
                        <span>Pending Approvals</span>
                        <h2>{ngos.length}</h2>
                    </div>

                    <div className="ngo-summary-description">
                        Organizations waiting for admin verification
                    </div>

                </div>

                {/* ALERTS */}

                {error && (
                    <div className="ngo-alert ngo-alert-error">
                        <AlertCircle size={19} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="ngo-alert ngo-alert-success">
                        <CheckCircle size={19} />
                        {success}
                    </div>
                )}

                {/* SEARCH */}

                <div className="ngo-verification-toolbar">

                    <div className="ngo-search-box">
                        <Search size={19} />

                        <input
                            type="text"
                            placeholder="Search NGO name, email or organization..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <span className="ngo-results-count">
                        {filteredNgos.length} Results
                    </span>

                </div>

                {/* NGO LIST */}

                {loading ? (
                    <div className="ngo-verification-loading">
                        <div className="ngo-spinner"></div>
                        <p>Loading NGO registrations...</p>
                    </div>
                ) : filteredNgos.length === 0 ? (

                    <div className="ngo-verification-empty">

                        <div className="ngo-empty-icon">
                            <Users size={35} />
                        </div>

                        <h3>
                            {search
                                ? "No matching NGOs found"
                                : "No Pending NGO Registrations"}
                        </h3>

                        <p>
                            {search
                                ? "Try another search term."
                                : "All currently registered NGOs have been reviewed."}
                        </p>

                    </div>

                ) : (

                    <div className="ngo-verification-grid">

                        {filteredNgos.map((ngo) => (

                            <div
                                className="ngo-verification-card"
                                key={ngo._id}
                            >

                                {/* CARD HEADER */}

                                <div className="ngo-card-header">

                                    <div className="ngo-card-avatar">
                                        <Building2 size={25} />
                                    </div>

                                    <span className="ngo-pending-status">
                                        <Clock size={13} />
                                        Pending
                                    </span>

                                </div>

                                {/* NGO DETAILS */}

                                <div className="ngo-card-details">

                                    <h3>
                                        {ngo.ngoDetails?.organizationName ||
                                            ngo.name}
                                    </h3>

                                    <p className="ngo-contact-name">
                                        Contact Person: {ngo.name}
                                    </p>

                                    <div className="ngo-detail-row">
                                        <Mail size={16} />
                                        <span>{ngo.email || "Not provided"}</span>
                                    </div>

                                    <div className="ngo-detail-row">
                                        <Phone size={16} />
                                        <span>{ngo.phone || "Not provided"}</span>
                                    </div>

                                    <div className="ngo-detail-row">
                                        <MapPin size={16} />
                                        <span>{ngo.address || "Not provided"}</span>
                                    </div>

                                    <div className="ngo-detail-row">
                                        <ShieldCheck size={16} />
                                        <span>
                                            Registration No:{" "}
                                            {ngo.ngoDetails?.registrationNumber ||
                                                "Not provided"}
                                        </span>
                                    </div>

                                </div>

                                {/* CARD FOOTER */}

                                <div className="ngo-card-footer">

                                    <button
                                        className="ngo-approve-btn"
                                        onClick={() =>
                                            handleVerify(ngo._id)
                                        }
                                        disabled={approvingId === ngo._id}
                                    >
                                        <CheckCircle size={17} />

                                        {approvingId === ngo._id
                                            ? "Approving..."
                                            : "Approve NGO"}
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>
        </DashboardLayout>
    );
};

export default NGOVerification;