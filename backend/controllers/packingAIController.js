import axios from "axios";
import {AI_BACKEND_URL} from "../../Constants.js";


export const health = async (req, res) => {
    try {
        const { data } = await axios.get(`${AI_BACKEND_URL}/health`, { timeout: 3000 });
        return res.json({
            ok: true,
            python: data,
        });
    } catch (err) {
        return res.status(503).json({
            ok: false,
            error: "python service unreachable",
            detail: err.message,
        });
    }
};

export const predictItems = async (req, res) => {
    const trip = req.body;

    try {
        const { data } = await axios.post(`${AI_BACKEND_URL}/predict`, trip, {
            headers: { "Content-Type": "application/json" },
            timeout: 8000,
        });
        return res.json(data);
    } catch (err) {
        return res.status(503).json({
            ok: false,
            error: "python service unreachable",
            detail: err.message,
        });
    }
};