import React, { useState } from "react";
import {
    Building2,
    MapPin,
    Save,
    LoaderCircle,
    CheckCircle,
    AlertCircle,
    LocateFixed,
    ShieldCheck,
    User,
    Mail,
    Phone
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import "./NGOProfile.css";

const NGOProfile = () => {
    const { user } = useAuth();

    const [form, setForm] = useState({
        organizationName:
            user?.ngoDetails?.organizationName || "",
        description:
            user?.ngoDetails?.description || "",
        serviceRadiusKm:
            user?.ngoDetails?.serviceRadiusKm || 10,
        latitude:
            user?.location?.coordinates?.[1] ?? "",
        longitude:
            user?.location?.coordinates?.[0] ?? ""
    });

    const [saving, setSaving] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setLocating(true);
        setError("");
        setSuccess("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setForm((previous) => ({
                    ...previous,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6)
                }));

                setLocating(false);
                setSuccess("Current location captured. Save your profile to update it.");
            },
            (geoError) => {
                let message = "Unable to get your location.";

                if (geoError.code === 1) {
                    message = "Location permission was denied. Please allow location access.";
                } else if (geoError.code === 2) {
                    message = "Your current location is unavailable.";
                } else if (geoError.code === 3) {
                    message = "Location request timed out. Please try again.";
                }

                setError(message);
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const organizationName = form.organizationName.trim();
        const description = form.description.trim();
        const radius = Number(form.serviceRadiusKm);

        if (!organizationName) {
            setError("Please enter your organization name.");
            return;
        }

        if (!Number.isFinite(radius) || radius < 1 || radius > 100) {
            setError("Service radius must be between 1 and 100 km.");
            return;
        }

        const latitudeProvided = String(form.latitude).trim() !== "";
        const longitudeProvided = String(form.longitude).trim() !== "";

        if (latitudeProvided !== longitudeProvided) {
            setError("Please provide both latitude and longitude.");
            return;
        }

        const payload = {
            organizationName,
            description,
            serviceRadiusKm: radius
        };

        if (latitudeProvided && longitudeProvided) {
            const latitude = Number(form.latitude);
            const longitude = Number(form.longitude);

            if (
                !Number.isFinite(latitude) ||
                latitude < -90 ||
                latitude > 90 ||
                !Number.isFinite(longitude) ||
                longitude < -180 ||
                longitude > 180
            ) {
                setError("Please enter valid latitude and longitude.");
                return;
            }

            payload.latitude = latitude;
            payload.longitude = longitude;
        }

        try {
            setSaving(true);

            const response = await API.put("/ngo/profile", payload);

            setSuccess(
                response.data?.message ||
                "NGO profile updated successfully!"
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update NGO profile."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout role="ngo">
            <div className="ngo-profile-page">

                <div className="ngo-profile-heading">
                    <div>
                        <span className="ngo-profile-eyebrow">
                            ORGANIZATION SETTINGS
                        </span>
                        <h1>NGO Profile</h1>
                        <p>
                            Manage your organization details and
                            the area where you collect food donations.
                        </p>
                    </div>

                    <div className="ngo-profile-verified">
                        <ShieldCheck size={19} />
                        Verified NGO
                    </div>
                </div>

                {error && (
                    <div className="ngo-profile-alert error">
                        <AlertCircle size={19} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="ngo-profile-alert success">
                        <CheckCircle size={19} />
                        {success}
                    </div>
                )}

                <div className="ngo-profile-layout">

                    {/* Account information */}
                    <aside className="ngo-profile-sidebar">
                        <div className="ngo-profile-user-card">
                            <div className="ngo-profile-avatar">
                                <Building2 size={32} />
                            </div>

                            <h2>
                                {form.organizationName ||
                                    user?.ngoDetails?.organizationName ||
                                    "Your Organization"}
                            </h2>

                            <span className="ngo-profile-role">
                                NGO ACCOUNT
                            </span>

                            <div className="ngo-profile-divider" />

                            <div className="ngo-profile-contact">
                                <User size={17} />
                                <span>{user?.name || "Account holder"}</span>
                            </div>

                            <div className="ngo-profile-contact">
                                <Mail size={17} />
                                <span>{user?.email || "Not available"}</span>
                            </div>

                            <div className="ngo-profile-contact">
                                <Phone size={17} />
                                <span>{user?.phone || "Not available"}</span>
                            </div>

                            <div className="ngo-profile-verification-note">
                                <ShieldCheck size={18} />
                                Your NGO account is verified.
                            </div>
                        </div>
                    </aside>

                    {/* Edit profile */}
                    <form
                        className="ngo-profile-form"
                        onSubmit={handleSubmit}
                    >
                        <section className="ngo-profile-section">
                            <div className="ngo-profile-section-heading">
                                <div className="ngo-profile-section-icon">
                                    <Building2 size={21} />
                                </div>

                                <div>
                                    <h2>Organization Information</h2>
                                    <p>
                                        Update your public organization details.
                                    </p>
                                </div>
                            </div>

                            <div className="ngo-profile-field">
                                <label htmlFor="organizationName">
                                    Organization Name
                                </label>

                                <input
                                    id="organizationName"
                                    name="organizationName"
                                    type="text"
                                    placeholder="Enter organization name"
                                    value={form.organizationName}
                                    onChange={handleChange}
                                    maxLength={120}
                                    required
                                />
                            </div>

                            <div className="ngo-profile-field">
                                <label htmlFor="description">
                                    Organization Description
                                </label>

                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe your NGO, its mission and the communities you support..."
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={5}
                                    maxLength={1000}
                                />

                                <span className="ngo-profile-helper">
                                    {form.description.length}/1000 characters
                                </span>
                            </div>
                        </section>

                        <section className="ngo-profile-section">
                            <div className="ngo-profile-section-heading">
                                <div className="ngo-profile-section-icon">
                                    <MapPin size={21} />
                                </div>

                                <div>
                                    <h2>Service Area Settings</h2>
                                    <p>
                                        Define how far your NGO can collect donations.
                                    </p>
                                </div>
                            </div>

                            <div className="ngo-profile-field">
                                <label htmlFor="serviceRadiusKm">
                                    Service Radius (Kilometres)
                                </label>

                                <div className="ngo-radius-input">
                                    <input
                                        id="serviceRadiusKm"
                                        name="serviceRadiusKm"
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={form.serviceRadiusKm}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span>KM</span>
                                </div>

                                <span className="ngo-profile-helper">
                                    Choose a radius between 1 and 100 kilometres.
                                </span>
                            </div>

                            <div className="ngo-radius-preview">
                                <div className="ngo-radius-preview-icon">
                                    <MapPin size={24} />
                                </div>

                                <div>
                                    <span>Your service coverage</span>
                                    <strong>
                                        {form.serviceRadiusKm || 0} KM radius
                                    </strong>
                                </div>
                            </div>

                            <div className="ngo-profile-field">
                                <div className="ngo-location-label">
                                    <label>NGO Location Coordinates</label>

                                    <button
                                        type="button"
                                        className="ngo-location-button"
                                        onClick={handleGetLocation}
                                        disabled={locating}
                                    >
                                        {locating ? (
                                            <LoaderCircle
                                                size={15}
                                                className="ngo-profile-spin"
                                            />
                                        ) : (
                                            <LocateFixed size={15} />
                                        )}

                                        {locating
                                            ? "Getting location..."
                                            : "Use Current Location"}
                                    </button>
                                </div>

                                <div className="ngo-coordinate-grid">
                                    <div>
                                        <label htmlFor="latitude">
                                            Latitude
                                        </label>

                                        <input
                                            id="latitude"
                                            name="latitude"
                                            type="number"
                                            step="any"
                                            placeholder="Example: 17.3850"
                                            value={form.latitude}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="longitude">
                                            Longitude
                                        </label>

                                        <input
                                            id="longitude"
                                            name="longitude"
                                            type="number"
                                            step="any"
                                            placeholder="Example: 78.4867"
                                            value={form.longitude}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <span className="ngo-profile-helper">
                                    Enter both coordinates or leave both empty.
                                    Your NGO location helps the system find nearby donations.
                                </span>
                            </div>
                        </section>

                        <div className="ngo-profile-footer">
                            <div>
                                <ShieldCheck size={17} />
                                Your organization details are securely updated.
                            </div>

                            <button
                                type="submit"
                                className="ngo-profile-save"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <LoaderCircle
                                            size={18}
                                            className="ngo-profile-spin"
                                        />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NGOProfile;