import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    CalendarDays,
    Package,
    Utensils,
    Clock,
    UserRound,
    AlertCircle,
    RefreshCw,
    Thermometer,
    Leaf,
    ShieldCheck,
    Phone,
    Mail,
    Info,
    CheckCircle2,
    Truck,
    Hash,
    Navigation,
    ExternalLink,
    MapPinned,
    Image as ImageIcon
} from "lucide-react";

import API from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./DonationDetails.css";

const formatDate = (value) => {
    if (!value) return "Not provided";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not provided";
    }

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const formatArray = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
        } catch {
            return value.trim() ? [value] : [];
        }
    }

    return [];
};

const getDonationCoordinates = (donation) => {
    const coordinates = donation?.location?.coordinates;

    let latitude;
    let longitude;

    if (Array.isArray(coordinates) && coordinates.length >= 2) {
        longitude = Number(coordinates[0]);
        latitude = Number(coordinates[1]);
    } else {
        latitude = Number(donation?.latitude);
        longitude = Number(donation?.longitude);
    }

    const valid =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180 &&
        !(latitude === 0 && longitude === 0);

    return {
        latitude: valid ? latitude : null,
        longitude: valid ? longitude : null,
        valid
    };
};

const SectionHeading = ({ icon: Icon, title, description }) => (
    <div className="donation-section-heading">
        <div className="donation-section-icon">
            <Icon size={21} />
        </div>
        <div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    </div>
);

const DetailItem = ({ label, value }) => (
    <div className="donation-detail-item">
        <span>{label}</span>
        <strong>{value || "Not provided"}</strong>
    </div>
);

const DonationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [imageError, setImageError] = useState(false);

    const fetchDonation = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get(`/donations/${id}`);
            const data = response.data;

            const item =
                data?.donation ||
                data?.data?.donation ||
                data?.data ||
                data;

            if (!item || !(item._id || item.id)) {
                throw new Error("Donation details were not found.");
            }

            setDonation(item);
        } catch (err) {
            console.error("Donation details error:", err);
            console.error("Server response:", err.response?.data);

            setDonation(null);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load donation details."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDonation();
    }, [fetchDonation]);

    const imageUrl =
        donation?.images?.[0]?.url ||
        donation?.imageUrl ||
        "";

    useEffect(() => {
        setImageError(false);
    }, [imageUrl]);

    const { latitude, longitude, valid: hasCoordinates } =
        getDonationCoordinates(donation);

    const allergens = formatArray(donation?.allergens);
    const dietaryTags = formatArray(donation?.dietaryTags);

    const status = donation?.status || "UNKNOWN";
    const statusClass = status.toLowerCase().replaceAll("_", "-");

    const directionsUrl = hasCoordinates
        ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        : "";

    const statusDescription = {
        AVAILABLE: "This donation is available for verified NGOs to collect.",
        ACCEPTED: "An NGO has accepted this food donation.",
        PICKED_UP: "The food donation has been picked up by the NGO.",
        COMPLETED: "This donation has been successfully completed.",
        EXPIRED: "The collection period for this donation has expired.",
        CANCELLED: "This donation has been cancelled."
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="donation-details-state">
                    <div className="donation-details-loader" />
                    <h3>Loading donation details</h3>
                    <p>Please wait while we retrieve your donation information.</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !donation) {
        return (
            <DashboardLayout>
                <div className="donation-details-state error">
                    <div className="donation-error-icon">
                        <AlertCircle size={36} />
                    </div>

                    <h2>Unable to open donation</h2>
                    <p>{error || "Donation not found."}</p>

                    <div className="donation-details-actions">
                        <button onClick={fetchDonation}>
                            <RefreshCw size={17} />
                            Try Again
                        </button>

                        <button
                            className="secondary"
                            onClick={() => navigate("/donor/donations")}
                        >
                            <ArrowLeft size={17} />
                            Back to My Donations
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="donation-details-page">

                <button
                    className="donation-back-button"
                    onClick={() => navigate("/donor/donations")}
                >
                    <ArrowLeft size={18} />
                    Back to My Donations
                </button>

                <div className="donation-details-heading">
                    <div>
                        <span className="donation-details-eyebrow">
                            DONATION MANAGEMENT
                        </span>

                        <h1>Donation Details</h1>

                        <p>
                            Manage your food donation and track its collection
                            information.
                        </p>
                    </div>

                    <span className={`donation-detail-status ${statusClass}`}>
                        <span className="status-dot" />
                        {status.replaceAll("_", " ")}
                    </span>
                </div>

                <div className="donation-details-layout">

                    <main className="donation-details-main">

                        {/* FOOD OVERVIEW */}

                        <section className="donation-detail-card food-overview">

                            <div className="donation-detail-image">
                                {imageUrl && !imageError ? (
                                    <img
                                        src={imageUrl}
                                        alt={donation.foodName || "Donated food"}
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className="donation-image-placeholder">
                                        <ImageIcon size={48} />
                                        <span>No food image available</span>
                                    </div>
                                )}
                            </div>

                            <div className="food-overview-content">
                                <span className="donation-detail-category">
                                    {donation.category || "Food"}
                                </span>

                                <h2>
                                    {donation.foodName || "Food Donation"}
                                </h2>

                                <p>
                                    {donation.description ||
                                        "No additional description was provided."}
                                </p>

                                <div className="food-overview-quantity">
                                    <Package size={20} />
                                    <strong>
                                        {donation.quantity ?? "—"}{" "}
                                        {donation.unit || ""}
                                    </strong>
                                </div>

                                <div className="food-overview-created">
                                    <CalendarDays size={15} />
                                    Added on {formatDate(donation.createdAt)}
                                </div>
                            </div>
                        </section>

                        {/* QUICK INFORMATION */}

                        <section className="donation-quick-stats">
                            <div className="donation-quick-stat">
                                <div className="quick-stat-icon">
                                    <Utensils size={20} />
                                </div>
                                <div>
                                    <span>Category</span>
                                    <strong>{donation.category || "Food"}</strong>
                                </div>
                            </div>

                            <div className="donation-quick-stat">
                                <div className="quick-stat-icon">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <span>Quantity</span>
                                    <strong>
                                        {donation.quantity ?? "—"}{" "}
                                        {donation.unit || ""}
                                    </strong>
                                </div>
                            </div>

                            <div className="donation-quick-stat">
                                <div className="quick-stat-icon">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <span>Food Expiry</span>
                                    <strong>{formatDate(donation.expiryTime)}</strong>
                                </div>
                            </div>
                        </section>

                        {/* FOOD SCHEDULE */}

                        <section className="donation-detail-card">
                            <SectionHeading
                                icon={CalendarDays}
                                title="Food Schedule"
                                description="Preparation, expiry and collection timings"
                            />

                            <div className="donation-detail-grid">
                                <DetailItem
                                    label="Preparation Time"
                                    value={formatDate(donation.preparationTime)}
                                />

                                <DetailItem
                                    label="Expiry Time"
                                    value={formatDate(donation.expiryTime)}
                                />

                                <DetailItem
                                    label="Collection Deadline"
                                    value={formatDate(donation.collectionDeadline)}
                                />

                                <DetailItem
                                    label="Created On"
                                    value={formatDate(donation.createdAt)}
                                />
                            </div>
                        </section>

                        {/* PICKUP LOCATION AND MAP */}

                        <section className="donation-detail-card donation-location-card">

                            <SectionHeading
                                icon={MapPinned}
                                title="Pickup Location"
                                description="Find the exact place where the food donation is available"
                            />

                            <div className="donation-address">
                                <MapPin size={22} />
                                <p>
                                    {donation.address ||
                                        "Pickup address not provided."}
                                </p>
                            </div>

                            {hasCoordinates ? (
                                <>
                                    <div className="donation-map-heading">
                                        <div>
                                            <h4>Donation Location Map</h4>
                                            <p>
                                                Map marker indicates the saved
                                                donation coordinates.
                                            </p>
                                        </div>

                                        <span className="map-live-label">
                                            <span />
                                            Location available
                                        </span>
                                    </div>

                                    <div className="donation-map-frame">
                                        <iframe
                                            title="Food donation pickup location"
                                            src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`}
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            allowFullScreen
                                        />
                                    </div>

                                    <div className="donation-map-footer">
                                        <div className="donation-coordinate-info">
                                            <div>
                                                <span>Latitude</span>
                                                <strong>{latitude.toFixed(6)}</strong>
                                            </div>

                                            <div>
                                                <span>Longitude</span>
                                                <strong>{longitude.toFixed(6)}</strong>
                                            </div>
                                        </div>

                                        <a
                                            href={directionsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="donation-directions-button"
                                        >
                                            <Navigation size={17} />
                                            Get Directions
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div className="donation-map-unavailable">
                                    <MapPin size={30} />
                                    <div>
                                        <strong>Map location unavailable</strong>
                                        <p>
                                            Latitude and longitude have not been
                                            saved for this donation. Please update
                                            the donation location to display the map.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {donation.preferredPickupTime && (
                                <div className="donation-extra-info">
                                    <Clock size={18} />
                                    <div>
                                        <span>Preferred Pickup Time</span>
                                        <strong>
                                            {donation.preferredPickupTime}
                                        </strong>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* STORAGE INFORMATION */}

                        <section className="donation-detail-card">
                            <SectionHeading
                                icon={Thermometer}
                                title="Storage Information"
                                description="Food handling and preservation instructions"
                            />

                            <div className="donation-info-block">
                                <span>Storage Instructions</span>
                                <p>
                                    {donation.storageInstructions ||
                                        "No special storage instructions provided."}
                                </p>
                            </div>

                            {donation.storageTemperature && (
                                <div className="donation-extra-info">
                                    <Thermometer size={18} />
                                    <div>
                                        <span>Storage Temperature</span>
                                        <strong>
                                            {donation.storageTemperature}
                                        </strong>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* DIETARY INFORMATION */}

                        <section className="donation-detail-card">
                            <SectionHeading
                                icon={Leaf}
                                title="Dietary Information"
                                description="Dietary preferences and food allergens"
                            />

                            <div className="donation-tag-section">
                                <h4>
                                    <Leaf size={16} />
                                    Dietary Tags
                                </h4>

                                {dietaryTags.length > 0 ? (
                                    <div className="donation-tags">
                                        {dietaryTags.map((tag, index) => (
                                            <span
                                                className="donation-tag dietary"
                                                key={`${tag}-${index}`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="donation-empty-text">
                                        No dietary tags provided.
                                    </p>
                                )}
                            </div>

                            <div className="donation-tag-section">
                                <h4>
                                    <ShieldCheck size={16} />
                                    Allergens
                                </h4>

                                {allergens.length > 0 ? (
                                    <div className="donation-tags">
                                        {allergens.map((allergen, index) => (
                                            <span
                                                className="donation-tag allergen"
                                                key={`${allergen}-${index}`}
                                            >
                                                {allergen}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="donation-empty-text">
                                        No allergens specified.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* PICKUP INSTRUCTIONS */}

                        <section className="donation-detail-card">
                            <SectionHeading
                                icon={Truck}
                                title="Pickup Instructions"
                                description="Additional information for food collection"
                            />

                            <div className="donation-info-block">
                                <p>
                                    {donation.pickupInstructions ||
                                        "No additional pickup instructions provided."}
                                </p>
                            </div>
                        </section>

                    </main>

                    {/* SIDEBAR */}

                    <aside className="donation-details-sidebar">

                        <section className="donation-detail-card status-card">
                            <SectionHeading
                                icon={CheckCircle2}
                                title="Donation Status"
                                description="Current collection progress"
                            />

                            <div className={`status-card-indicator ${statusClass}`}>
                                <span className={`status-dot ${statusClass}`} />
                                <strong>
                                    {status.replaceAll("_", " ")}
                                </strong>
                            </div>

                            <p>
                                {statusDescription[status] ||
                                    "Check the donation status for the latest update."}
                            </p>
                        </section>

                        <section className="donation-detail-card">
                            <SectionHeading
                                icon={UserRound}
                                title="Collection Details"
                                description="Assigned NGO information"
                            />

                            {donation.ngo ? (
                                <div className="donation-ngo-info">
                                    <strong>
                                        {donation.ngo.organizationName ||
                                            donation.ngo.name ||
                                            "Assigned NGO"}
                                    </strong>

                                    {donation.ngo.email && (
                                        <span>
                                            <Mail size={15} />
                                            {donation.ngo.email}
                                        </span>
                                    )}

                                    {donation.ngo.phone && (
                                        <span>
                                            <Phone size={15} />
                                            {donation.ngo.phone}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="donation-no-ngo">
                                    <Info size={19} />
                                    <p>
                                        No NGO has accepted this donation yet.
                                    </p>
                                </div>
                            )}
                        </section>

                        {donation.donor &&
                            typeof donation.donor === "object" && (
                                <section className="donation-detail-card">
                                    <SectionHeading
                                        icon={UserRound}
                                        title="Donor Information"
                                        description="Donation provided by"
                                    />

                                    <div className="donation-ngo-info">
                                        <strong>
                                            {donation.donor.name || "Food Donor"}
                                        </strong>

                                        {donation.donor.email && (
                                            <span>
                                                <Mail size={15} />
                                                {donation.donor.email}
                                            </span>
                                        )}

                                        {donation.donor.phone && (
                                            <span>
                                                <Phone size={15} />
                                                {donation.donor.phone}
                                            </span>
                                        )}
                                    </div>
                                </section>
                            )}

                        <section className="donation-detail-card donation-id-card">
                            <SectionHeading
                                icon={Hash}
                                title="Reference ID"
                                description="Unique donation identification"
                            />

                            <strong>{donation._id || donation.id}</strong>
                        </section>

                        <button
                            className="donation-refresh-button"
                            onClick={fetchDonation}
                        >
                            <RefreshCw size={17} />
                            Refresh Status
                        </button>

                    </aside>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DonationDetails;