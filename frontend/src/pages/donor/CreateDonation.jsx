import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Utensils,
    Package,
    ImagePlus,
    MapPin,
    Clock3,
    Leaf,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    UploadCloud,
    X,
    Heart,
    Sparkles,
    CalendarDays,
    Thermometer,
    Truck,
    Navigation,
    Trash2
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import API from "../../services/api";
import "./CreateDonation.css";

const initialFormData = {
    foodName: "",
    category: "Vegetarian",
    quantity: "10",
    unit: "plates",
    description: "",
    preparationDate: "",
    preparationClock: "",
    preparationPeriod: "AM",
    expiryDate: "",
    expiryClock: "",
    expiryPeriod: "PM",
    collectionDate: "",
    collectionClock: "",
    collectionPeriod: "PM",
    address: "",
    latitude: "",
    longitude: "",
    storageInstructions: "",
    storageTemperature: "",
    pickupInstructions: "",
    preferredPickupTime: ""
};

const convertToDate = (date, time, period) => {
    if (!date || !time || !period) return null;

    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const timeMatch = time.trim().match(/^(\d{1,2})\s*:\s*([0-5]\d)$/);

    if (!dateMatch || !timeMatch) return null;

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    if (hours < 1 || hours > 12) return null;
    if (period !== "AM" && period !== "PM") return null;

    let hour24 = hours % 12;

    if (period === "PM") {
        hour24 += 12;
    }

    const result = new Date(year, month - 1, day, hour24, minutes, 0);

    if (
        result.getFullYear() !== year ||
        result.getMonth() !== month - 1 ||
        result.getDate() !== day
    ) {
        return null;
    }

    return result;
};

const CreateDonation = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState(initialFormData);
    const [images, setImages] = useState([]);
    const [dietaryTags, setDietaryTags] = useState([]);
    const [allergens, setAllergens] = useState([]);
    const [allergenInput, setAllergenInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [locationLoading, setLocationLoading] = useState(false);

    const updateField = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setError("");
        setSuccess("");
    };

    const toggleTag = (tag) => {
        setDietaryTags((previous) =>
            previous.includes(tag)
                ? previous.filter((item) => item !== tag)
                : [...previous, tag]
        );
    };

    const addAllergen = () => {
        const value = allergenInput.trim();

        if (!value) return;

        if (!allergens.some((item) => item.toLowerCase() === value.toLowerCase())) {
            setAllergens((previous) => [...previous, value]);
        }

        setAllergenInput("");
    };

    const removeAllergen = (item) => {
        setAllergens((previous) => previous.filter((value) => value !== item));
    };

    const handleImageChange = (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        const allowedFiles = selectedFiles.filter((file) =>
            file.type.startsWith("image/")
        );

        if (allowedFiles.length !== selectedFiles.length) {
            setError("Please select image files only.");
        }

        const remainingSlots = 5 - images.length;
        const filesToAdd = allowedFiles.slice(0, remainingSlots);

        if (allowedFiles.length > remainingSlots) {
            setError("You can upload a maximum of 5 images.");
        }

        const newImages = filesToAdd.map((file) => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setImages((previous) => [...previous, ...newImages]);
        event.target.value = "";
    };

    const removeImage = (index) => {
        setImages((previous) => {
            const selected = previous[index];

            if (selected?.preview) {
                URL.revokeObjectURL(selected.preview);
            }

            return previous.filter((_, imageIndex) => imageIndex !== index);
        });
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Your browser does not support location detection.");
            return;
        }

        setLocationLoading(true);
        setError("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData((previous) => ({
                    ...previous,
                    latitude: String(position.coords.latitude),
                    longitude: String(position.coords.longitude)
                }));

                setLocationLoading(false);
            },
            () => {
                setError("Unable to get your location. Please allow location access or enter coordinates manually.");
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    };

    const validateForm = () => {
        if (!formData.foodName.trim()) {
            return "Please enter the food name.";
        }

        if (!formData.quantity || Number(formData.quantity) <= 0) {
            return "Please enter a valid food quantity.";
        }

        if (!formData.description.trim()) {
            return "Please enter a short description of the food.";
        }

        const preparation = convertToDate(
            formData.preparationDate,
            formData.preparationClock,
            formData.preparationPeriod
        );

        const expiry = convertToDate(
            formData.expiryDate,
            formData.expiryClock,
            formData.expiryPeriod
        );

        const deadline = convertToDate(
            formData.collectionDate,
            formData.collectionClock,
            formData.collectionPeriod
        );

       if (!preparation) {
    return `DEBUG - Preparation Date: [${formData.preparationDate}]
Preparation Time: [${formData.preparationClock}]
Preparation AM/PM: [${formData.preparationPeriod}]`;
}

        if (!expiry) {
            return "Please check Food expiry time: enter a date, time like 06:00, and select AM or PM.";
        }

        if (!deadline) {
            return "Please check Collect before: enter a date, time like 04:30, and select AM or PM.";
        }

        const now = new Date();

        if (preparation > now) {
    return "Preparation date and time cannot be in the future.";
}

if (expiry <= preparation) {
    return "Food expiry must be later than preparation time.";
}

if (deadline <= preparation) {
    return "Collection deadline must be after preparation time.";
}

if (deadline >= expiry) {
    return "Collection deadline must be before food expiry.";
}

if (deadline <= now) {
    return `DEBUG COLLECTION:
Date: ${formData.collectionDate}
Time: ${formData.collectionClock}
AM/PM: ${formData.collectionPeriod}
Converted deadline: ${deadline}
Current time: ${now}`;
}

if (expiry <= now) {
    return "Food expiry date and time must be in the future.";
}

        if (!formData.address.trim()) {
            return "Please enter the food collection address.";
        }

        const latitude = Number(formData.latitude);
        const longitude = Number(formData.longitude);

        if (
            formData.latitude === "" ||
            formData.longitude === "" ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return "Please provide valid location coordinates using the location button or manual entry.";
        }

        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const preparation = convertToDate(
            formData.preparationDate,
            formData.preparationClock,
            formData.preparationPeriod
        );

        const expiry = convertToDate(
            formData.expiryDate,
            formData.expiryClock,
            formData.expiryPeriod
        );

        const deadline = convertToDate(
            formData.collectionDate,
            formData.collectionClock,
            formData.collectionPeriod
        );

        const payload = new FormData();

        payload.append("foodName", formData.foodName.trim());
        payload.append("category", formData.category);
        payload.append("quantity", formData.quantity);
        payload.append("unit", formData.unit);
        payload.append("description", formData.description.trim());
        payload.append("preparationTime", preparation.toISOString());
        payload.append("expiryTime", expiry.toISOString());
        payload.append("collectionDeadline", deadline.toISOString());
        payload.append("address", formData.address.trim());
        payload.append("latitude", formData.latitude);
        payload.append("longitude", formData.longitude);
        payload.append("storageInstructions", formData.storageInstructions.trim());
        payload.append("storageTemperature", formData.storageTemperature.trim());
        payload.append("pickupInstructions", formData.pickupInstructions.trim());
        payload.append("preferredPickupTime", formData.preferredPickupTime.trim());
        payload.append("dietaryTags", JSON.stringify(dietaryTags));
        payload.append("allergens", JSON.stringify(allergens));

        images.forEach((image) => {
            payload.append("images", image.file);
        });

        try {
            setLoading(true);

            await API.post("/donations", payload);

            setSuccess("Your food donation has been published successfully!");

            images.forEach((image) => {
                if (image.preview) URL.revokeObjectURL(image.preview);
            });

            setFormData(initialFormData);
            setImages([]);
            setDietaryTags([]);
            setAllergens([]);
            setAllergenInput("");

            window.scrollTo({ top: 0, behavior: "smooth" });

            setTimeout(() => {
                navigate("/donor/donations");
            }, 1500);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to publish your donation. Please check your details and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="create-donation-page">
                <div className="donation-page-heading">
                    <button
                        type="button"
                        className="donation-back-button"
                        onClick={() => navigate("/donor/dashboard")}
                    >
                        <ArrowLeft size={18} />
                        Back to dashboard
                    </button>

                    <div className="donation-heading-content">
                        <div>
                            <span className="donation-eyebrow">
                                <Heart size={15} /> SHARE FOOD, SPREAD KINDNESS
                            </span>
                            <h1>Create a food donation</h1>
                            <p>
                                Share your surplus food with nearby NGOs and help make
                                sure good food reaches people who need it.
                            </p>
                        </div>

                        <div className="donation-heading-icon">
                            <Utensils size={38} />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="donation-alert donation-alert-error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button type="button" onClick={() => setError("")}>
                            <X size={17} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="donation-alert donation-alert-success">
                        <CheckCircle2 size={20} />
                        <span>{success}</span>
                    </div>
                )}

                <form className="donation-form" onSubmit={handleSubmit}>
                    <section className="donation-section">
                        <div className="donation-section-heading">
                            <div className="donation-section-icon">
                                <Utensils size={21} />
                            </div>
                            <div>
                                <h2>Food information</h2>
                                <p>Tell NGOs what food you are donating.</p>
                            </div>
                        </div>

                        <div className="donation-form-grid">
                            <div className="donation-field donation-field-full">
                                <label htmlFor="foodName">Food name *</label>
                                <input
                                    id="foodName"
                                    name="foodName"
                                    value={formData.foodName}
                                    onChange={updateField}
                                    placeholder="Example: Vegetable biryani"
                                    required
                                />
                            </div>

                            <div className="donation-field">
                                <label htmlFor="category">Food category *</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={updateField}
                                >
                                    <option value="Vegetarian">Vegetarian</option>
                                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                                    <option value="Bakery">Bakery</option>
                                    <option value="Fruits">Fruits</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="donation-field">
                                <label htmlFor="quantity">Quantity *</label>
                                <div className="donation-quantity-control">
                                    <input
                                        id="quantity"
                                        name="quantity"
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={formData.quantity}
                                        onChange={updateField}
                                        required
                                    />
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={updateField}
                                        aria-label="Quantity unit"
                                    >
                                        <option value="plates">Plates</option>
                                        <option value="kg">Kg</option>
                                        <option value="packets">Packets</option>
                                        <option value="boxes">Boxes</option>
                                    </select>
                                </div>
                            </div>

                            <div className="donation-field donation-field-full">
                                <label htmlFor="description">Food description *</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="4"
                                    value={formData.description}
                                    onChange={updateField}
                                    placeholder="Describe the food, its condition, and any important details..."
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section className="donation-section">
                        <div className="donation-section-heading">
                            <div className="donation-section-icon">
                                <ImagePlus size={21} />
                            </div>
                            <div>
                                <h2>Food photos</h2>
                                <p>Add clear photos so NGOs can identify the food.</p>
                            </div>
                        </div>

                        <div
                            className="donation-upload-area"
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    fileInputRef.current?.click();
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={handleImageChange}
                            />
                            <div className="donation-upload-icon">
                                <UploadCloud size={28} />
                            </div>
                            <h3>Upload food images</h3>
                            <p>Click to browse images from your device</p>
                            <span>Maximum 5 images</span>
                        </div>

                        {images.length > 0 && (
                            <div className="donation-image-grid">
                                {images.map((image, index) => (
                                    <div className="donation-image-item" key={`${image.file.name}-${index}`}>
                                        <img src={image.preview} alt={`Food preview ${index + 1}`} />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            aria-label="Remove image"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="donation-section">
                        <div className="donation-section-heading">
                            <div className="donation-section-icon">
                                <CalendarDays size={21} />
                            </div>
                            <div>
                                <h2>Important timings</h2>
                                <p>Enter the date, time, and AM/PM for each event.</p>
                            </div>
                        </div>

                        <div className="donation-time-grid">
                            <div className="donation-time-card">
                                <div className="donation-time-card-heading">
                                    <Clock3 size={19} />
                                    <div>
                                        <h3>Prepared on *</h3>
                                        <p>When was the food prepared?</p>
                                    </div>
                                </div>

                                <label htmlFor="preparationDate">Preparation date</label>
                                <input
                                    id="preparationDate"
                                    type="date"
                                    name="preparationDate"
                                    value={formData.preparationDate}
                                    onChange={updateField}
                                    required
                                />

                                <label htmlFor="preparationClock">Preparation time</label>
                                <div className="donation-time-input">
                                    <input
                                        id="preparationClock"
                                        type="text"
                                        name="preparationClock"
                                        placeholder="09:30"
                                        value={formData.preparationClock}
                                        onChange={updateField}
                                        required
                                    />
                                    <select
                                        name="preparationPeriod"
                                        value={formData.preparationPeriod}
                                        onChange={updateField}
                                        aria-label="Preparation AM or PM"
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>

                            <div className="donation-time-card">
                                <div className="donation-time-card-heading">
                                    <CalendarDays size={19} />
                                    <div>
                                        <h3>Food expiry time *</h3>
                                        <p>When should the food no longer be consumed?</p>
                                    </div>
                                </div>

                                <label htmlFor="expiryDate">Expiry date</label>
                                <input
                                    id="expiryDate"
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={updateField}
                                    required
                                />

                                <label htmlFor="expiryClock">Expiry time</label>
                                <div className="donation-time-input">
                                    <input
                                        id="expiryClock"
                                        type="text"
                                        name="expiryClock"
                                        placeholder="08:00"
                                        value={formData.expiryClock}
                                        onChange={updateField}
                                        required
                                    />
                                    <select
                                        name="expiryPeriod"
                                        value={formData.expiryPeriod}
                                        onChange={updateField}
                                        aria-label="Expiry AM or PM"
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>

                            <div className="donation-time-card donation-time-card-wide">
                                <div className="donation-time-card-heading">
                                    <Truck size={19} />
                                    <div>
                                        <h3>Collect before *</h3>
                                        <p>Set the final time by which the NGO must collect the food.</p>
                                    </div>
                                </div>

                                <div className="donation-form-grid">
                                    <div className="donation-field">
                                        <label htmlFor="collectionDate">Collection date</label>
                                        <input
                                            id="collectionDate"
                                            type="date"
                                            name="collectionDate"
                                            value={formData.collectionDate}
                                            onChange={updateField}
                                            required
                                        />
                                    </div>

                                    <div className="donation-field">
                                        <label htmlFor="collectionClock">Collection time</label>
                                        <div className="donation-time-input">
                                            <input
                                                id="collectionClock"
                                                type="text"
                                                name="collectionClock"
                                                placeholder="05:00"
                                                value={formData.collectionClock}
                                                onChange={updateField}
                                                required
                                            />
                                            <select
                                                name="collectionPeriod"
                                                value={formData.collectionPeriod}
                                                onChange={updateField}
                                                aria-label="Collection AM or PM"
                                            >
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="donation-time-tip">
                            <AlertCircle size={18} />
                            Enter time in 12-hour format, such as <strong>09:30</strong>, and select
                            <strong> AM</strong> or <strong> PM</strong> separately. Do not type AM/PM inside the time box.
                        </div>
                    </section>

                    <section className="donation-section">
                        <div className="donation-section-heading">
                            <div className="donation-section-icon">
                                <Leaf size={21} />
                            </div>
                            <div>
                                <h2>Dietary information</h2>
                                <p>Help NGOs understand the food ingredients and dietary details.</p>
                            </div>
                        </div>

                        <div className="donation-field">
                            <label>Dietary tags</label>
                            <div className="donation-tag-list">
                                {["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Egg-Free"].map((tag) => (
                                    <button
                                        type="button"
                                        key={tag}
                                        className={`donation-tag ${dietaryTags.includes(tag) ? "active" : ""}`}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {dietaryTags.includes(tag) && <CheckCircle2 size={15} />}
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <p className="donation-field-help">
                                Select only tags that accurately describe your food.
                            </p>
                        </div>

                        <div className="donation-field donation-allergen-field">
                            <label htmlFor="allergenInput">Allergens or ingredients to mention</label>
                            <div className="donation-allergen-entry">
                                <input
                                    id="allergenInput"
                                    value={allergenInput}
                                    onChange={(event) => setAllergenInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            addAllergen();
                                        }
                                    }}
                                    placeholder="Example: Milk, nuts, wheat"
                                />
                                <button type="button" onClick={addAllergen}>Add</button>
                            </div>

                            {allergens.length > 0 && (
                                <div className="donation-tag-list donation-allergen-list">
                                    {allergens.map((item) => (
                                        <span className="donation-allergen-chip" key={item}>
                                            {item}
                                            <button
                                                type="button"
                                                onClick={() => removeAllergen(item)}
                                                aria-label={`Remove ${item}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="donation-section">
                        <div className="donation-section-heading">
                            <div className="donation-section-icon">
                                <MapPin size={21} />
                            </div>
                            <div>
                                <h2>Pickup location</h2>
                                <p>Tell nearby NGOs where they can collect the donation.</p>
                            </div>
                        </div>

                        <div className="donation-field donation-field-full">
                            <label htmlFor="address">Full pickup address *</label>
                            <textarea
                                id="address"
                                name="address"
                                rows="3"
                                value={formData.address}
                                onChange={updateField}
                                placeholder="Enter building, street, area, city, and landmark..."
                                required
                            />
                        </div>

                        <div className="donation-location-action">
                            <div>
                                <strong>Get your current coordinates</strong>
                                <p>Allow browser location access to fill latitude and longitude.</p>
                            </div>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={locationLoading}
                            >
                                <Navigation size={17} />
                                {locationLoading ? "Getting location..." : "Use my location"}
                            </button>
                        </div>

                        <div className="donation-form-grid">
                            <div className="donation-field">
                                <label htmlFor="latitude">Latitude *</label>
                                <input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={updateField}
                                    placeholder="17.9689"
                                    required
                                />
                            </div>

                            <div className="donation-field">
                                <label htmlFor="longitude">Longitude *</label>
                                <input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={updateField}
                                    placeholder="79.5941"
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section className="donation-section">
                        <div className="donation-section-heading">
                            <div className="donation-section-icon">
                                <Thermometer size={21} />
                            </div>
                            <div>
                                <h2>Storage and pickup instructions</h2>
                                <p>Share details that help keep the food safe during collection.</p>
                            </div>
                        </div>

                        <div className="donation-form-grid">
                            <div className="donation-field">
                                <label htmlFor="storageTemperature">Storage temperature</label>
                                <input
                                    id="storageTemperature"
                                    name="storageTemperature"
                                    value={formData.storageTemperature}
                                    onChange={updateField}
                                    placeholder="Example: Refrigerated, 5°C or below"
                                />
                            </div>

                            <div className="donation-field">
                                <label htmlFor="preferredPickupTime">Preferred pickup time</label>
                                <input
                                    id="preferredPickupTime"
                                    name="preferredPickupTime"
                                    value={formData.preferredPickupTime}
                                    onChange={updateField}
                                    placeholder="Example: 3 PM to 5 PM"
                                />
                            </div>

                            <div className="donation-field donation-field-full">
                                <label htmlFor="storageInstructions">Storage instructions</label>
                                <textarea
                                    id="storageInstructions"
                                    name="storageInstructions"
                                    rows="3"
                                    value={formData.storageInstructions}
                                    onChange={updateField}
                                    placeholder="Example: Keep refrigerated in clean, covered containers."
                                />
                            </div>

                            <div className="donation-field donation-field-full">
                                <label htmlFor="pickupInstructions">Pickup instructions</label>
                                <textarea
                                    id="pickupInstructions"
                                    name="pickupInstructions"
                                    rows="3"
                                    value={formData.pickupInstructions}
                                    onChange={updateField}
                                    placeholder="Example: Please call before arriving. Collect from the main entrance."
                                />
                            </div>
                        </div>
                    </section>

                    <div className="donation-safety-note">
                        <ShieldCheck size={22} />
                        <div>
                            <strong>Food safety matters</strong>
                            <p>
                                Share accurate preparation and expiry times. Store food safely
                                and make it available for collection before the deadline.
                            </p>
                        </div>
                    </div>

                    <div className="donation-form-footer">
                        <button
                            type="button"
                            className="donation-cancel-button"
                            onClick={() => navigate("/donor/dashboard")}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="donation-submit-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>Publishing...</>
                            ) : (
                                <>
                                    <Heart size={18} />
                                    Publish donation
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default CreateDonation;