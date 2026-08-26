const express = require("express");

const app = express();
const PORT = 3000;

// Allow server to read JSON data
app.use(express.json());

// Serve frontend
app.use(express.static("../public"));

// Test route
app.get("/api/test", (req, res) => {
    res.json({
        message: "Backend is working!"
    });
});

// Reservation route
app.post("/api/reservations", (req, res) => {

    const reservation = req.body;

    console.log("New Reservation:");
    console.log(reservation);

    res.json({
        success: true,
        message: "Reservation received successfully!"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});