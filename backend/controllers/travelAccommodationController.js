import { sql } from "../config/db.js";

export const addTransportInfo = async (req, res) => {
    try {
        const {type, trip_id, price, note, number} = req.body;

        if (!trip_id || !type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await sql`
            INSERT INTO transport (trip_id, transport_type, transport_price, transport_note, transport_number)
            VALUES (${trip_id}, ${type}, ${price ?? null}, ${note ?? null}, ${number ?? null})
            RETURNING *
        `;

        res.json({
      message: "Transport added successfully",
      transport: result[0],
    });

    }
    catch (err) {
        console.error("error adding transport info:", err);
        res.status(500).json({ error: err.message });
    } 
}

export const readTransportInfo = async (req, res) => {
    try {
        const {trip_id} = req.query; 

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

export const updateTransportInfo = async (req, res) => {
    try {
        const {transport_id, type, price, note, number} = req.body;

        if (!transport_id) {
            return res.status(400).json({ error: "Missing required fields"});
        }

        const result = await sql`
            UPDATE transport 
            SET transport_type = ${type}, transport_price = ${price}, transport_note = ${note}, transport_number = ${number}
            WHERE transport_id = ${transport_id}
            RETURNING *
        `;  

            if (result.length === 0) {
                return res.status(404).json({ error: "Transport not found" });
    }       


        res.json({
            message: "Transport info updated successfully", 
            transportInfo: result[0]
        });
    }
    catch (err) {
        console.error("error updating transport info:", err);
        res.status(500).json({ error: err.message });
    }   
}

export const deleteTransportInfo = async (req, res) => {
    try {
        const {transport_id} = req.body; 

        if (!transport_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await sql`
            DELETE FROM transport
            WHERE transport_id = ${transport_id}
        `;

        res.json({
            message: "Transport info deleted successfully"
        });
    }
    catch (err) {
        console.error("error deleting transport info:", err);
        res.status(500).json({ error: err.message });
    }
}
    
export const addAccommodationInfo = async (req, res) => {
    try {
        const {trip_id, price, note} = req.body;
    
        if (!trip_id) {
            return res.status(400).json({error: "Missing required fields"});
        }

        const result = await sql`
            INSERT INTO accommodation (trip_id, accommodation_price, accommodation_note)
            VALUES (${trip_id}, ${price ?? null}, ${note ?? null})
            RETURNING *
        `;

        res.json({
      message: "Accommodation added successfully",
      accommodation: result[0],
    });
    }
    catch (err) {
        console.error("error adding accommodation info:", err);
        res.status(500).json({ error: err.message });
    }
}

export const readAccommodationInfo = async (req, res) => {
    try {
        const {trip_id} = req.query;

        if (!trip_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await sql`
            SELECT * FROM accommodation 
            WHERE trip_id = ${trip_id}
        `;

        res.json({
            message: "Accommodation info retrieved successfully", 
            accommodationInfo : result
        });
    }
    catch (err) {
        console.error("error retrieving accommodation info:", err);
        res.status(500).json({ error: err.message });
    }      
}

export const updateAccommodationInfo = async (req, res) => {
    try {
        const {accommodation_id, price, note} = req.body;

        if(!accommodation_id) {
            return res.status(400).json({ error: "Missing required fields"});
        }

        const result = await sql`
            UPDATE accommodation
            SET accommodation_price = ${price}, accommodation_note = ${note} 
            WHERE accommodation_id = ${accommodation_id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json ({ error: "Accommodation not found" });
        }

        res.json({
            message: "Accommodation info updated successfully",
            accommodationInfo: result[0]
        });
    }
    catch (err) {
        console.error("error updating accommodation info:", err);
        res.status(500).json({ error: err.message });
    }
}
