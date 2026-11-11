
import User from "../models/User.js";
import { createNotifications } from "./notificationService.js";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const earthRadiusKm = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
};

// Find verified NGOs within their individual service radius
export const getNearbyVerifiedNgos = async (donation) => {
    const coordinates = donation.location?.coordinates;

    if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !coordinates.every(Number.isFinite)
    ) {
        return [];
    }

    const [longitude, latitude] = coordinates;

    const nearbyNgos = await User.find({
        role: "ngo",
        isVerified: true,
        isActive: true,
        "location.type": "Point",
        "location.coordinates": { $exists: true, $ne: [] },
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude]
                },
                $maxDistance: 100000
            }
        }
    }).select("_id name location ngoDetails");

    return nearbyNgos.filter((ngo) => {
        const ngoCoordinates = ngo.location?.coordinates;

        if (
            !Array.isArray(ngoCoordinates) ||
            ngoCoordinates.length !== 2 ||
            !ngoCoordinates.every(Number.isFinite)
        ) {
            return false;
        }

        const [ngoLongitude, ngoLatitude] = ngoCoordinates;

        const distance = calculateDistance(
            latitude,
            longitude,
            ngoLatitude,
            ngoLongitude
        );

        const serviceRadius =
            Number(ngo.ngoDetails?.serviceRadiusKm) || 20;

        return distance <= serviceRadius;
    });
};

// Notify nearby verified NGOs
export const notifyNearbyNgos = async (
    donation,
    io,
    {
        type = "NEW_DONATION",
        message
    } = {}
) => {
    try {
        const matchingNgos = await getNearbyVerifiedNgos(donation);

        if (matchingNgos.length === 0) {
            console.log("No verified NGOs found within service range.");
            return 0;
        }

        const notificationMessage =
            message ||
            `New food donation available: ${donation.foodName}. Check the donation details.`;

        await createNotifications({
            receivers: matchingNgos.map((ngo) => ngo._id),
            donationId: donation._id,
            message: notificationMessage,
            type,
            io
        });

        console.log(
            `Sent ${type} notification to ${matchingNgos.length} nearby NGOs.`
        );

        return matchingNgos.length;
    } catch (error) {
        console.error("Nearby NGO matching error:", error.message);
        return 0;
    }
};
