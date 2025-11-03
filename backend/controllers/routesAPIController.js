import axios from "axios";

export const distanceByTransportation = async (req, res) => {
    try {
        const { origin, destination, wayOfTransportation } = req.body;

        // way of transportation MUST be one of: "DRIVE", "WALK", "BICYCLE", "TRANSIT" case sensitive
        const requestBody = {
            origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
            destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
            travelMode: wayOfTransportation,
            languageCode: "en-US",
            units: "IMPERIAL"
        };

        const response = await axios.post(
            "https://routes.googleapis.com/directions/v2:computeRoutes",
            requestBody,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": "routes.duration,routes.distanceMeters"
                }
            }
        );

        const route = response.data.routes?.[0];

        // if the route was impossible for example China to USA. Return nulls.
        if (!route) {
            return res.json({ distanceMiles: null, durationSeconds: null });
        }

        let distanceMeters = route.distanceMeters ?? null;

        let durationSeconds = 0;

        // duration might be a string like "165s" or an object with seconds
        if (typeof route.duration === "string" && route.duration.endsWith("s")) {
            durationSeconds = parseInt(route.duration.slice(0, -1));
        } else if (route.duration?.seconds != null) {
            durationSeconds = route.duration.seconds;
        }

        // convert meters to miles, rounded to two decimal places
        const metersToMiles = (meters) => Math.round((meters / 1609.34) * 100) / 100;

        res.json({
            distanceMiles: distanceMeters != null ? metersToMiles(distanceMeters) : null,
            durationSeconds
        });

    } catch (err) {
        console.error("Fetching distance failed:", err.response?.data || err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
