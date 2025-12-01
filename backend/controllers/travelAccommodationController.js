import { sql } from "../config/db.js";
import {io} from "../socket.js";

export const addTransportInfo = async (req, res) => {
    try {
        const {transport_type, trip_id, transport_price, transport_note, transport_number, username} = req.body;

        if (!trip_id || !transport_type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await sql`
            INSERT INTO transport (trip_id, transport_type, transport_price, transport_note, transport_number)
            VALUES (${trip_id}, ${transport_type}, ${transport_price ?? null}, ${transport_note ?? null}, ${transport_number ?? null})
            RETURNING *
        `;

        io.to(`trip_${trip_id}`).emit("addedTransport", transport_type, transport_number, transport_price, transport_note, username);

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
        const {transport_id, transport_type, transport_price, transport_note, transport_number, trip_id, username} = req.body;

        if (!transport_id) {
            return res.status(400).json({ error: "Missing required fields"});
        }

        const result = await sql`
            UPDATE transport 
            SET transport_type = ${transport_type}, transport_price = ${transport_price}, transport_note = ${transport_note}, transport_number = ${transport_number}
            WHERE transport_id = ${transport_id}
            RETURNING *
        `;  

            if (result.length === 0) {
                return res.status(404).json({ error: "Transport not found" });
    }       

        io.to(`trip_${trip_id}`).emit("updatedTransport", transport_type, transport_id, transport_number, transport_price, transport_note, username);

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
        const {transport_id, trip_id, transport_type, username, index} = req.body; 

        if (!transport_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await sql`
            DELETE FROM transport
            WHERE transport_id = ${transport_id}
        `;

        io.to(`trip_${trip_id}`).emit("deletedTransport", transport_type, username, index);

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
        const {trip_id, accommodation_price, accommodation_note, accommodation_type, username} = req.body;
    
        if (!trip_id) {
            return res.status(400).json({error: "Missing required fields"});
        }

        const result = await sql`
            INSERT INTO accommodation (trip_id, accommodation_price, accommodation_note, accommodation_type)
            VALUES (${trip_id}, ${accommodation_price ?? null}, ${accommodation_note ?? null}, ${accommodation_type})
            RETURNING *
        `;

        io.to(`trip_${trip_id}`).emit("addedAccommodation", accommodation_type, accommodation_price, accommodation_note, username);

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
        const {trip_id, accommodation_id, accommodation_price, accommodation_note, accommodation_type, username} = req.body;

        if(!accommodation_id) {
            return res.status(400).json({ error: "Missing required fields"});
        }

        const result = await sql`
            UPDATE accommodation
            SET accommodation_price = ${accommodation_price}, accommodation_note = ${accommodation_note}, accommodation_type = ${accommodation_type} 
            WHERE accommodation_id = ${accommodation_id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json ({ error: "Accommodation not found" });
        }

        io.to(`trip_${trip_id}`).emit("updatedAccommodation", accommodation_id, accommodation_type, accommodation_price, accommodation_note, username);

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

export const deleteAccommodationInfo = async (req, res) => {
    try {
        const {accommodation_id, trip_id, accommodation_type, username, index} = req.body;

        if (!accommodation_id) {
            return res.status(400).json({ error: "Missing required fields"})
        }

        const result = await sql`
            DELETE FROM accommodation
            WHERE accommodation_id = ${accommodation_id}
        `;

        io.to(`trip_${trip_id}`).emit("deletedAccommodation", accommodation_type, username, index);

        res.json({
            message: "Accommodation info deleted successfully" 
        });
    }
    catch (err) {
        console.error("error deleting accommodation info:", err);
        res.status(500).json({ error: err.message });
    }
}