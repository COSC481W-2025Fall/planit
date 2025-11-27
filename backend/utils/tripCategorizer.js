import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const CATEGORIES = [
    'Adventure',
    'Relaxation',
    'Business',
    'Cultural',
    'Nature',
    'Food',
    'Nightlife',
    'Family',
    'Romantic'
];

export async function categorizeTrip(tripName, activities) {

    try {
        const activitiesText = activities.map(a => a.activity_name).join(', ');

        const prompt = `
        You are a classification model
        User is planning a trip
        Trip Name: ${tripName}
        Activities: ${activitiesText}
        
        Choose EXACTLY ONE category from this list:
        ${CATEGORIES.join(', ')}
        
        Respond with only the category word. No extra text.
        `;

        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 5
        });

        const category = response.choices[0].message.content.trim();

        if (CATEGORIES.includes(category)) {
            return category;
        }

        return null;

    } catch (error) {
        console.error("Error categorizing trip:", error);
        return null;
    }
}