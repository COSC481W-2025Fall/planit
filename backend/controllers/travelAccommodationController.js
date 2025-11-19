import { sql } from "../config/db.js";

export const addTransportInfo = async (req, res) => {
    try {
        const {type, price, note, trip_id, number} = req.body;

        if (!trip_id || !type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await sql`
            INSERT INTO transport (trip_id, transport_type, transport_price, transport_note)
            VALUES (${transport_type}, ${trip_id}, ${transport_price ?? null}, ${transport_note ?? null} ${transport_number ?? null})
            RETURNING *
        `;

        res.json({
      message: "Activity added successfully",
      activity: created[0],
    });

    }
    catch (err) {
        console.error("error adding transport info:", err);
        res.status(500).json({ error: err.message });
    } 
}

export const readTransportInfo = async (req, res) => {
    try {
        const {trip_id} = req.body; 

        if (!trip_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await sql`
            SELECT * FROM transport
            WHERE trip_id = ${trip_id}
        `;

        res.json({
            message: "Transport info retrieved successfully",
            transportInfo: result
        });
    }   

    catch (err) {
        console.error("error retrieving transport info:", err);
        res.status(500).json({ error: err.message });
    }   
}

export const addAccommodationInfo = async (req, res) => {
    
}