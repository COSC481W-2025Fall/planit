import { vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import {sql} from "../config/db.js";
import express from "express";
import userRouter from "../routes/userRoutes.js";
import {readUser, deleteUser} from "../controllers/userController.js";

vi.mock("../config/db.js", () => ({
    sql: vi.fn(),
}));

// Create a special Express app for testing error scenarios
const testApp = express();
testApp.use(express.json());

// Middleware that overrides req.login to always return an error
// Any route in this testApp that calls req.login will hit an error.
testApp.use((req, res, next) => {
    req.login = (user, cb) => cb(new Error("Session error")); // force failure
    next();
});

testApp.use("/user", userRouter);

//helper functions
function TestAppWithUser() {
    const app = express();
    app.use(express.json());

    // Simulate logged-in user
    app.use((req, res, next) => {
        req.user = { user_id: 1 };
        next();
    });
    return app;
}

function TestAppWithNoUser() {
    const app = express();
    app.use(express.json());
    // No req.user
    app.use((req, res, next) => {
        req.user = undefined;
        next();
    });
    return app;
}

describe("Username creation", () => {
    it("should return 200 and success message when username is created", async () => {
        sql.mockResolvedValueOnce([{ user_id: 1, username: "test" }]);

        const res = await request(app)
        .post("/user/create") // adjust route if needed
        .send({ userId: 1, createUsername: "test" });

        expect(res.status).toBe(200);
    });

    it("should return 400 if username already exists", async () => {
        sql.mockResolvedValueOnce([]);
        const res = await request(app)

        .post("/user/create")
        .send({userId: 1, createUsername: "test"});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error", "User already has a username");
    });

  it("should return 500 if database throws an error", async () => {
    sql.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app)
      .post("/user/create")
      .send({ userId: 1, createUsername: "test" });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal Server Error");
  });
});

//Testing for updateUser function in userController.js
describe("Update user", () => {
    it("should update a user and refresh session", async () => {
        const mockUser = {user_id: 1, first_name: "John", last_name: "Test", username: "johnnytest"};

        sql.mockResolvedValueOnce([mockUser]);

        // Mock req.login to simulate session refresh
        app.request.login = vi.fn((user, cb) => cb(null));

        const res = await request(app)
        .put("/user/update")
        .send({userId: 1, firstname: "John", lastname: "Test", username: "johnnytest", customPhoto: "data:image/jpeg;base64,"});

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("success", true);
        expect(res.body.user).toEqual(mockUser);
    });

    it("should return 400 if username is null", async () => {
        const res = await request(app)
        .put("/user/update")
        .send({ userId: 1, firstname: "John" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error", "Username cannot be null");
    });

  it("should return 500 if database throws an error", async () => {
        sql.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(app)
        .put("/user/update")
        .send({userId: 1, firstname: "John", lastname: "Test", username: "johnnytest", customPhoto: "data:image/jpeg;base64,"});

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error", "Internal Server Error");
  });

    it("should return 500 if req.login fails", async () => {
        const mockUser = {user_id: 1, first_name: "John", last_name: "Test", username: "johnnytest"};
        sql.mockResolvedValueOnce([mockUser]);

        // Force req.login to call back with an error
        app.request.login = vi.fn((user, cb) => cb(new Error("Session error")));

        const res = await request(testApp)
        .put("/user/update")
        .send({userId: 1, firstname: "John", lastname: "Test", username: "johnnytest", customPhoto: "data:image/jpeg;base64,"});

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error", "Error refreshing session after update:");
    });
});

describe("Read user", () => {
    it("should return user data if logged in", async () => {
        const mockUserData = {first_name: "John", last_name: "Test", username: "johnnytest", email: "test@testmail.com", customPhoto: "data:image/jpeg;base64,"};

        sql.mockResolvedValueOnce([mockUserData]);

        const testApp = TestAppWithUser();
        testApp.get("/user/read", readUser);// Mount the route

        const res = await request(testApp).get("/user/read");

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("loggedIn", true);
        expect(res.body.user).toEqual(mockUserData);
  });

    it("should return 400 if user is not logged in", async () => {
        const testApp = TestAppWithNoUser();
        testApp.get("/user/read", readUser);

        const res = await request(testApp).get("/user/read");

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("loggedIn", false);
    });

    it("should return 400 if user is not found in database", async () => {
        const testApp = TestAppWithUser();
        testApp.get("/user/read", readUser);

        // Mock SQL to return an empty array (user not found)
        sql.mockResolvedValueOnce([]);

        const res = await request(testApp).get("/user/read");

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error", "User not found");
    });

    it("should return 500 if database throws an error", async () => {
        const testApp = TestAppWithUser();
        testApp.get("/user/read", readUser);

        sql.mockRejectedValueOnce(new Error("DB error"));
        const res = await request(testApp).get("/user/read");

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error", "Internal Server Error");
    })
});

describe("Delete user", () => {
    it("should return 200 and confirmation message on successful deletion", async () => {
        const testApp = TestAppWithUser();
        testApp.delete("/user/delete", deleteUser);

        // Mock database returns deleted user
        sql.mockResolvedValueOnce([{user_id: 1}]);

        const res = await request(testApp).delete("/user/delete");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            loggedIn: false,
            message: "User deleted",
        });
    });

    it("should return 400 if user is not logged in", async () => {
        const testApp = TestAppWithNoUser();
        testApp.delete("/user/delete", deleteUser);

        const res = await request(testApp).delete("/user/delete");

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("loggedIn", false);
    });

    it("should return 400 if user is not found", async () => {
        const testApp = TestAppWithUser();
        testApp.delete("/user/delete", deleteUser);

        // Mock database returns empty array
        sql.mockResolvedValueOnce([]);

        const res = await request(testApp).delete("/user/delete");

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error", "User not found");
    });

    it("should return 500 if database throws an error", async () => {
        const testApp = TestAppWithUser();

        testApp.delete("/user/delete", deleteUser);

        sql.mockRejectedValueOnce(new Error("DB error"));

        const res = await request(testApp).delete("/user/delete");

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error", "Internal Server Error");
    });
});