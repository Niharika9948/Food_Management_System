import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    Clock,
    CalendarDays,
    Package,
    User,
    Phone,
    Mail,
    ShieldCheck,
    Utensils,
    CheckCircle,
    AlertCircle,
    LoaderCircle,
    Navigation,
    Heart
} from "lucide-react";

import API from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./NGODonationDetails.css";

const formatDate = (value) => {
    if (!value) return "Not provided";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getDonation = (response) => {
    return (
        response?.data?.donation ||
        response?.donation ||
        response?.data?.data?.donation ||
        response?.data?.data ||
        null
    );
};

const NGODonationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchDonation();
    }, [id]);

    const fetchDonation = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get(`/donations/${id}`);
            const donationData = getDonation(response);

            if (!donationData) {
                throw new Error("Donation details could not be loaded.");
            }

            setDonation(donationData);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load donation details."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptDonation = async () => {
        if (!donation?._id || accepting) return;

        const confirmed = window.confirm(
            `Are you sure you want to accept "${donation.foodName}"?`
        );

        if (!confirmed) return;

        try {
            setAccepting(true);
            setError("");
            setSuccess("");

            const response = await API.patch(
                `/ngo/accept/${donation._id}`
            );

            const updatedDonation = getDonation(response);

            if (updatedDonation) {
                setDonation(updatedDonation);
            } else {
                await fetchDonation();
            }

            setSuccess(
                response.data?.message ||
                "Food donation accepted successfully!"
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to accept this donation."
            );
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="ngo">
                <div className="ngo-details-loading">
                    <LoaderCircle className="loading-spinner" size={38} />
                    <p>Loading donation details...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error && !donation) {
        return (
            <DashboardLayout role="ngo">
                <div className="ngo-details-page">
                    <button
                        className="ngo-details-back"
                        onClick={() => navigate("/ngo/donations")}
                    >
                        <ArrowLeft size={18} />
                        Back to donations
                    </button>

                    <div className="ngo-details-error">
                        <AlertCircle size={32} />
                        <h3>Unable to load donation</h3>
                        <p>{error}</p>
                        <button onClick={fetchDonation}>
                            Try Again
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!donation) return null;

    const donor =
        typeof donation.donor === "object"
            ? donation.donor
            : {};

    const ngo =
        typeof donation.ngo === "object"
            ? donation.ngo
            : {};

    const coordinates = donation.location?.coordinates || [];

    const longitude = coordinates[0];
    const latitude = coordinates[1];

    const hasCoordinates =
        Number.isFinite(Number(latitude)) &&
        Number.isFinite(Number(longitude));

    const mapUrl = hasCoordinates
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : null;

    const isAvailable = donation.status === "AVAILABLE";
    const isAccepted = donation.status === "ACCEPTED";
    const isPickedUp = donation.status === "PICKED_UP";
    const isCompleted = donation.status === "COMPLETED";

    const statusClass = donation.status?.toLowerCase() || "unknown";

    return (
        <DashboardLayout role="ngo">
            <div className="ngo-details-page">

                {/* Back button */}
                <button
                    className="ngo-details-back"
                    onClick={() => navigate("/ngo/donations")}
                >
                    <ArrowLeft size={18} />
                    Back to available donations
                </button>

                {/* Page heading */}
                <div className="ngo-details-heading">
                    <div>
                        <span className="ngo-details-eyebrow">
                            FOOD DONATION DETAILS
                        </span>

                        <h1>{donation.foodName}</h1>

                        <p>
                            Review the food information and collection
                            details before accepting this donation.
                        </p>
                    </div>

                    <span className={`ngo-status-badge ${statusClass}`}>
                        {donation.status}
                    </span>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="ngo-details-alert error">
                        <AlertCircle size={19} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="ngo-details-alert success">
                        <CheckCircle size={19} />
                        {success}
                    </div>
                )}

                <div className="ngo-details-layout">

                    {/* Main content */}
                    <div className="ngo-details-main">

                        {/* Food image */}
                        <section className="ngo-details-image-card">
                            {donation.imageUrl ? (
                                <img
                                    src={donation.imageUrl}
                                    alt={donation.foodName}
                                    className="ngo-details-food-image"
                                    onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : (
                                <div className="ngo-details-image-placeholder">
                                    <Utensils size={58} />
                                    <span>Food donation</span>
                                </div>
                            )}
                        </section>

                        {/* Food information */}
                        <section className="ngo-details-card">
                            <div className="ngo-details-section-heading">
                                <div className="ngo-section-icon">
                                    <Package size={20} />
                                </div>

                                <div>
                                    <h2>Food Information</h2>
                                    <p>Details about the donated food</p>
                                </div>
                            </div>

                            <div className="ngo-info-grid">
                                <div className="ngo-info-item">
                                    <span>Food Name</span>
                                    <strong>{donation.foodName}</strong>
                                </div>

                                <div className="ngo-info-item">
                                    <span>Category</span>
                                    <strong>{donation.category}</strong>
                                </div>

                                <div className="ngo-info-item">
                                    <span>Quantity</span>
                                    <strong>
                                        {donation.quantity} {donation.unit}
                                    </strong>
                                </div>

                                <div className="ngo-info-item">
                                    <span>Current Status</span>
                                    <strong>{donation.status}</strong>
                                </div>
                            </div>

                            <div className="ngo-details-description">
                                <span>Description</span>
                                <p>
                                    {donation.description ||
                                        "No description provided."}
                                </p>
                            </div>

                            <div className="ngo-details-description">
                                <span>Storage Instructions</span>
                                <p>
                                    {donation.storageInstructions ||
                                        "No special storage instructions provided."}
                                </p>
                            </div>
                        </section>

                        {/* Time information */}
                        <section className="ngo-details-card">
                            <div className="ngo-details-section-heading">
                                <div className="ngo-section-icon">
                                    <Clock size={20} />
                                </div>

                                <div>
                                    <h2>Important Timings</h2>
                                    <p>Preparation, collection and expiry</p>
                                </div>
                            </div>

                            <div className="ngo-time-list">
                                <div className="ngo-time-item">
                                    <div className="ngo-time-icon">
                                        <CalendarDays size={19} />
                                    </div>

                                    <div>
                                        <span>Food Preparation Time</span>
                                        <strong>
                                            {formatDate(donation.preparationTime)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="ngo-time-item">
                                    <div className="ngo-time-icon">
                                        <Clock size={19} />
                                    </div>

                                    <div>
                                        <span>Collection Deadline</span>
                                        <strong>
                                            {formatDate(donation.collectionDeadline)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="ngo-time-item expiry">
                                    <div className="ngo-time-icon">
                                        <AlertCircle size={19} />
                                    </div>

                                    <div>
                                        <span>Food Expiry Time</span>
                                        <strong>
                                            {formatDate(donation.expiryTime)}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Pickup location */}
                        <section className="ngo-details-card">
                            <div className="ngo-details-section-heading">
                                <div className="ngo-section-icon">
                                    <MapPin size={20} />
                                </div>

                                <div>
                                    <h2>Pickup Location</h2>
                                    <p>Address provided by the donor</p>
                                </div>
                            </div>

                            <div className="ngo-location-content">
                                <MapPin size={22} />

                                <p>{donation.address}</p>
                            </div>

                            {hasCoordinates && (
                                <div className="ngo-coordinate-text">
                                    <span>Latitude: {latitude}</span>
                                    <span>Longitude: {longitude}</span>
                                </div>
                            )}

                            {mapUrl && (
                                <a
                                    href={mapUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ngo-map-link"
                                >
                                    <Navigation size={17} />
                                    Open Location in Google Maps
                                </a>
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="ngo-details-sidebar">

                        {/* Donor information */}
                        <section className="ngo-details-card donor-card">
                            <div className="ngo-details-section-heading">
                                <div className="ngo-section-icon">
                                    <User size={20} />
                                </div>

                                <div>
                                    <h2>Donor Information</h2>
                                    <p>Donation shared by</p>
                                </div>
                            </div>

                            <div className="ngo-donor-profile">
                                <div className="ngo-donor-avatar">
                                    <User size={25} />
                                </div>

                                <div>
                                    <strong>
                                        {donor.name || "Food Donor"}
                                    </strong>
                                    <span>Verified donation listing</span>
                                </div>
                            </div>

                            {donor.phone && (
                                <div className="ngo-contact-item">
                                    <Phone size={17} />
                                    <span>{donor.phone}</span>
                                </div>
                            )}

                            {donor.email && (
                                <div className="ngo-contact-item">
                                    <Mail size={17} />
                                    <span>{donor.email}</span>
                                </div>
                            )}

                            {!donor.phone && !donor.email && (
                                <p className="ngo-private-contact">
                                    Donor contact details will be available
                                    after your NGO accepts this donation.
                                </p>
                            )}
                        </section>

                        {/* Acceptance card */}
                        <section className="ngo-accept-card">
                            <div className="ngo-accept-icon">
                                {isCompleted ? (
                                    <CheckCircle size={27} />
                                ) : (
                                    <Heart size={27} />
                                )}
                            </div>

                            <h2>
                                {isAvailable
                                    ? "Ready to Help?"
                                    : isAccepted
                                        ? "Donation Accepted"
                                        : isPickedUp
                                            ? "Food Picked Up"
                                            : isCompleted
                                                ? "Donation Completed"
                                                : "Donation Status"}
                            </h2>

                            <p>
                                {isAvailable
                                    ? "Accept this donation to arrange collection and help reduce food waste."
                                    : isAccepted
                                        ? "Your NGO has accepted this donation. You can manage it from My Collections."
                                        : isPickedUp
                                            ? "This food donation has been marked as picked up."
                                            : isCompleted
                                                ? "This donation has been successfully completed."
                                                : "This donation is no longer available for acceptance."}
                            </p>

                            {isAvailable && (
                                <button
                                    className="ngo-accept-button"
                                    onClick={handleAcceptDonation}
                                    disabled={accepting}
                                >
                                    {accepting ? (
                                        <>
                                            <LoaderCircle
                                                size={19}
                                                className="loading-spinner"
                                            />
                                            Accepting...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={19} />
                                            Accept Donation
                                        </>
                                    )}
                                </button>
                            )}

                            {!isAvailable && (
                                <button
                                    className="ngo-collections-button"
                                    onClick={() => navigate("/ngo/collections")}
                                >
                                    View My Collections
                                </button>
                            )}

                            <span className="ngo-accept-note">
                                <ShieldCheck size={15} />
                                Only verified NGOs can accept donations.
                            </span>
                        </section>

                        {/* Reference information */}
                        <section className="ngo-reference-card">
                            <span>Donation Reference ID</span>
                            <strong>{donation._id}</strong>

                            <span>Posted On</span>
                            <strong>{formatDate(donation.createdAt)}</strong>
                        </section>
                    </aside>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NGODonationDetails;