import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Create a Theme context.
const ThemeCtx = createContext({ theme: "light", setTheme: () => {}, toggle: () => {} });

// Always start with light unless a saved value exists.
const initialTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return "light";
};

// Provide the theme values to everything inside this component.
export function ThemeProvider({ children }) {
    // Store the current theme .
    const [theme, setTheme] = useState(initialTheme);

    // Apply the theme to <html> and persist it whenever it changes.
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);


    // save & reuse the context value.
    const value = useMemo(() => ({
        theme,
        setTheme,
        toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    }), [theme]);

    // Expose the theme context to children.
    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

// Convenience hook to read from the Theme context.
export const useTheme = () => useContext(ThemeCtx);