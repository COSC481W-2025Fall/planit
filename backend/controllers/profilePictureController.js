import {sql} from "../config/db.js";
//import bodyParser from 'body-parser';


export const storeProfilePicture = async (req, res) => {
    try{
        const {userId, customPhoto} = req.body;
        if(!userId || !customPhoto){
            return res.status(400).json({error: "userId and customPhoto are required"});
        }

        //This is a check using regex to ensure a proper format has been sent
        const base64Pattern = /^data:image\/(jpeg|png);base64,/;
        if (!base64Pattern.test(customPhoto)) {
            return res.status(400).json({ error: "Invalid image format" });
        }
        const result = await sql`
            UPDATE users
            SET photo = ${customPhoto}
            WHERE user_id = ${userId}
        `
        return res.status(200).json({meesage: "Profile picture updated successfully"});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const retrieveProfilePicture = async (req, res) => {

}