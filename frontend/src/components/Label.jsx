import {
    Mountain,
    Smile,
    Briefcase,
    Theater,
    Leaf,
    Utensils,
    Moon,
    Users,
    Heart,
    Tag
} from "lucide-react";

export default function Label({ category, className = "" }) {
    if (!category) {
        return null;
    }

    const EMOJIS = {
        Adventure: Mountain,
        Relaxation: Smile,
        Business: Briefcase,
        Cultural: Theater,
        Nature: Leaf,
        Food: Utensils,
        Nightlife: Moon,
        Family: Users,
        Romantic: Heart
    };

    const COLORS = {
        Adventure: "#f97316",   // orange
        Relaxation: "#60a5fa",  // soft blue
        Business: "#3b82f6",    // bright blue
        Cultural: "#d97706",    // golden
        Nature: "#22c55e",      // green
        Food: "#ea580c",        // red/orange
        Nightlife: "#8b5cf6",   // purple
        Family: "#14b8a6",      // teal
        Romantic: "#ef4444"     // red
    };

    const Icon = EMOJIS[category] || Tag;
    const color = COLORS[category] || "#6b7280"; // default gray

    return (
        <span
            className={`trip-label-base ${className}`}
            style={{
                backgroundColor: `${color}20`,  // translucent fill
                color,
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginLeft: "10px"
            }} 
        >

            <Icon size={16} />
            <span className="trip-label-text"> {category}</span>
        </span>
    );
}