// backend/appFactory.js
import express from "express";
import tripRouter from "../routes/tripRoutes.js"; // whatever mounts your controller handlers

export function makeApp({ injectUser } = {}) {
    const app = express();
    app.use(express.json());

    // Only for tests: inject a fake logged-in user
    if (injectUser) {
        app.use((req, _res, next) => {
            req.user = { user_id: 123 }; // change per test if needed
            next();
        });
    }

    app.use("/trip", tripRouter);
    return app;
}