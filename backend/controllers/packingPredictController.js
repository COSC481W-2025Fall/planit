import axios from "axios";
import {AI_BACKEND_URL} from "../../Constants.js";

export const health = async (req, res) => {
    if (!req.user) return res.status(401).json({ loggedIn: false });

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