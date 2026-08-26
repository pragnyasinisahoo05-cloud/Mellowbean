require("dotenv").config();

const rateLimit = require("express-rate-limit");
const express = require("express");
const session = require("express-session");
const SQLiteStore =
    require("better-sqlite3-session-store")(session);

const app = express();
const PORT = process.env.PORT || 3000;

const db = require("./database");


// =====================================================
// SETTINGS
// =====================================================

const MAX_CAPACITY = 25;

// Each reservation occupies seats for 90 minutes
const RESERVATION_DURATION = 90;

// Café reservation hours
const OPENING_MINUTES = 8 * 60;           // 8:00 AM
const LAST_START_MINUTES = 20 * 60 + 30;  // 8:30 PM


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());


// =====================================================
// SESSION
// =====================================================

app.use(
    session({
        store: new SQLiteStore({
            client: db,

            expired: {
                clear: true,
                intervalMs: 900000
            }
        }),

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: false
        }
    })
);


// =====================================================
// RATE LIMITING
// =====================================================

// General customer/API protection
const customerRateLimit = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 10,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many requests. Please try again later."
    }

});


// =====================================================
// BOOKING VERIFICATION RATE LIMIT
// =====================================================

const verificationRateLimit = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 5,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many verification attempts. Please try again later."
    }

});


// =====================================================
// AVAILABILITY RATE LIMIT
// =====================================================

const availabilityRateLimit = rateLimit({

    windowMs: 60 * 1000,

    max: 60,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many availability requests. Please slow down."
    }

});


// =====================================================
// SERVE FRONTEND
// =====================================================

app.use(express.static("../public"));


// =====================================================
// HELPER FUNCTIONS
// =====================================================


// Convert HH:MM → minutes
function timeToMinutes(time) {

    const parts = time.split(":");

    const hours = Number(parts[0]);

    const minutes = Number(parts[1]);

    return hours * 60 + minutes;

}


// =====================================================
// CREATE CUSTOMER BOOKING ID
// Example: database ID 35 → MB0035
// =====================================================

function createBookingId(id) {

    return "MB" +
        String(id).padStart(4, "0");

}


// =====================================================
// VALIDATE DATE
// =====================================================

function isValidDate(date) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {

        return false;

    }

    const selectedDate =
        new Date(`${date}T00:00:00`);

    return !Number.isNaN(
        selectedDate.getTime()
    );

}


// =====================================================
// CHECK WHETHER DATE IS IN THE PAST
// =====================================================

function isPastDate(date) {

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const selectedDate =
        new Date(`${date}T00:00:00`);

    return selectedDate < today;

}


// =====================================================
// VALIDATE RESERVATION TIME
// =====================================================

function isValidReservationTime(time) {

    if (!/^\d{2}:\d{2}$/.test(time)) {

        return false;

    }

    const minutes =
        timeToMinutes(time);

    return (
        minutes >= OPENING_MINUTES &&
        minutes <= LAST_START_MINUTES
    );

}


// =====================================================
// CHECK RESERVATION OVERLAP
// =====================================================

function reservationsOverlap(
    startA,
    startB
) {

    const endA =
        startA + RESERVATION_DURATION;

    const endB =
        startB + RESERVATION_DURATION;

    return (
        startA < endB &&
        endA > startB
    );

}


// =====================================================
// ADMIN ACCESS CHECK
// =====================================================

function requireAdmin(
    req,
    res,
    next
) {

    if (!req.session.isAdmin) {

        return res.status(401).json({

            success: false,

            message:
                "Admin authentication required."

        });

    }

    next();

}


// =====================================================
// GET ALL RESERVATIONS
// ADMIN ONLY
// =====================================================

app.get(
    "/api/reservations",
    requireAdmin,
    (req, res) => {

        try {

            const reservations =
                db
                    .prepare(`
                        SELECT *
                        FROM reservations
                        ORDER BY id DESC
                    `)
                    .all();


            return res.json({

                success: true,

                reservations:
                    reservations

            });

        } catch (error) {

            console.error(
                "Database error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Could not fetch reservations."

            });

        }

    }
);


// =====================================================
// CHECK ADMIN AUTH
// =====================================================

app.get(
    "/api/check-auth",
    (req, res) => {

        if (req.session.isAdmin) {

            return res.json({

                authenticated: true

            });

        }

        return res.status(401).json({

            authenticated: false

        });

    }
);


// =====================================================
// ADMIN LOGIN
// =====================================================

app.post(
    "/api/login",
    (req, res) => {

        const username =
            req.body.username;

        const password =
            req.body.password;


        const ADMIN_USERNAME =
            process.env.ADMIN_USERNAME;

        const ADMIN_PASSWORD =
            process.env.ADMIN_PASSWORD;


        if (
            username === ADMIN_USERNAME &&
            password === ADMIN_PASSWORD
        ) {

            req.session.isAdmin = true;

            return res.json({

                success: true,

                message:
                    "Login successful."

            });

        }


        return res.status(401).json({

            success: false,

            message:
                "Invalid username or password."

        });

    }
);


// =====================================================
// ADMIN LOGOUT
// =====================================================

app.post(
    "/api/logout",
    (req, res) => {

        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Could not logout."

                    });

                }


                res.clearCookie(
                    "connect.sid"
                );


                return res.json({

                    success: true,

                    message:
                        "Logged out successfully."

                });

            }
        );

    }
);


// =====================================================
// TEST API
// =====================================================

app.get(
    "/api/test",
    (req, res) => {

        return res.json({

            message:
                "Backend is working!"

        });

    }
);


// =====================================================
// CHECK AVAILABILITY
// =====================================================

app.get(
    "/api/availability",
    availabilityRateLimit,
    (req, res) => {

        const date =
            req.query.date;

        const time =
            req.query.time;


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (!date || !time) {

            return res.status(400).json({

                success: false,

                message:
                    "Date and time are required."

            });

        }


        try {

            // =================================================
            // DATE VALIDATION
            // =================================================

            if (!isValidDate(date)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please select a valid date."

                });

            }


            // =================================================
            // TIME VALIDATION
            // =================================================

            if (!isValidReservationTime(time)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Our café accepts reservations from 8:00 AM to 8:30 PM."

                });

            }


            const requestedStart =
                timeToMinutes(time);


            // =================================================
            // GET RESERVATIONS
            // =================================================

            const reservations =
                db
                    .prepare(`
                        SELECT time, guests
                        FROM reservations
                        WHERE date = ?
                        AND status IN ('Pending', 'Confirmed')
                    `)
                    .all(date);


            let bookedGuests = 0;


            // =================================================
            // CALCULATE BOOKED GUESTS
            // =================================================

            reservations.forEach(
                (reservation) => {

                    const existingStart =
                        timeToMinutes(
                            reservation.time
                        );


                    if (
                        reservationsOverlap(
                            requestedStart,
                            existingStart
                        )
                    ) {

                        bookedGuests +=
                            Number(
                                reservation.guests
                            );

                    }

                }
            );


            // =================================================
            // AVAILABLE SEATS
            // =================================================

            const availableSeats =
                Math.max(
                    MAX_CAPACITY -
                    bookedGuests,
                    0
                );


            // =================================================
            // FULLY BOOKED
            // =================================================

            if (availableSeats === 0) {

                return res.json({

                    success: true,

                    available: 0,

                    booked:
                        bookedGuests,

                    capacity:
                        MAX_CAPACITY,

                    message:
                        "This time slot is fully booked."

                });

            }


            // =================================================
            // AVAILABLE
            // =================================================

            return res.json({

                success: true,

                available:
                    availableSeats,

                booked:
                    bookedGuests,

                capacity:
                    MAX_CAPACITY,

                message:
                    `${availableSeats} seat(s) available.`

            });

        } catch (error) {

            console.error(
                "Availability check error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Could not check availability."

            });

        }

    }
);


// =====================================================
// CREATE RESERVATION
// =====================================================

app.post(
    "/api/reservations",
    customerRateLimit,
    (req, res) => {

        const {
            name,
            phone,
            date,
            time,
            guests,
            message
        } = req.body;


        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (
            !name ||
            !phone ||
            !date ||
            !time ||
            !guests
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill in all required fields."

            });

        }


        // =================================================
        // NAME VALIDATION
        // =================================================

        const cleanName =
            String(name).trim();


        if (cleanName.length < 2) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid name."

            });

        }


        // =================================================
        // PHONE VALIDATION
        // =================================================

        const cleanPhone =
            String(phone).trim();


        if (!/^[0-9]{10}$/.test(cleanPhone)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid 10-digit phone number."

            });

        }


        // =================================================
        // GUEST VALIDATION
        // =================================================

        const guestCount =
            Number(guests);


        if (
            !Number.isInteger(guestCount) ||
            guestCount < 1 ||
            guestCount > 8
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Number of guests must be between 1 and 8."

            });

        }


        // =================================================
        // DATE VALIDATION
        // =================================================

        if (!isValidDate(date)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please select a valid date."

            });

        }


        if (isPastDate(date)) {

            return res.status(400).json({

                success: false,

                message:
                    "You cannot make a reservation for a past date."

            });

        }


        // =================================================
        // TIME VALIDATION
        // =================================================

        if (!isValidReservationTime(time)) {

            return res.status(400).json({

                success: false,

                message:
                    "Our café accepts reservations from 8:00 AM to 8:30 PM."

            });

        }


        const selectedMinutes =
            timeToMinutes(time);


        // =================================================
        // DUPLICATE CUSTOMER CHECK
        // =================================================

        try {

            const existingReservations =
                db
                    .prepare(`
                        SELECT time
                        FROM reservations
                        WHERE phone = ?
                        AND date = ?
                        AND status IN ('Pending', 'Confirmed')
                    `)
                    .all(
                        cleanPhone,
                        date
                    );


            const duplicateOverlap =
                existingReservations.some(
                    (reservation) => {

                        const existingStart =
                            timeToMinutes(
                                reservation.time
                            );


                        return reservationsOverlap(
                            selectedMinutes,
                            existingStart
                        );

                    }
                );


            if (duplicateOverlap) {

                return res.status(409).json({

                    success: false,

                    message:
                        "You already have a reservation around this time. Please choose another time."

                });

            }

        } catch (error) {

            console.error(
                "Duplicate reservation check error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Could not check reservation availability."

            });

        }


        // =================================================
        // ATOMIC CAPACITY CHECK + INSERT
        // =================================================

        try {

            const createReservation =
                db.transaction(() => {

                    // =============================================
                    // GET EXISTING RESERVATIONS
                    // =============================================

                    const reservations =
                        db
                            .prepare(`
                                SELECT time, guests
                                FROM reservations
                                WHERE date = ?
                                AND status IN ('Pending', 'Confirmed')
                            `)
                            .all(date);


                    let bookedGuests = 0;


                    // =============================================
                    // CALCULATE BOOKED SEATS
                    // =============================================

                    reservations.forEach(
                        (reservation) => {

                            const existingStart =
                                timeToMinutes(
                                    reservation.time
                                );


                            if (
                                reservationsOverlap(
                                    selectedMinutes,
                                    existingStart
                                )
                            ) {

                                bookedGuests +=
                                    Number(
                                        reservation.guests
                                    );

                            }

                        }
                    );


                    // =============================================
                    // AVAILABLE SEATS
                    // =============================================

                    const availableSeats =
                        MAX_CAPACITY -
                        bookedGuests;


                    // =============================================
                    // CAPACITY CHECK
                    // =============================================

                    if (
                        guestCount >
                        availableSeats
                    ) {

                        return {

                            success: false,

                            available:
                                Math.max(
                                    availableSeats,
                                    0
                                ),

                            booked:
                                bookedGuests,

                            capacity:
                                MAX_CAPACITY,

                            message:
                                availableSeats > 0
                                    ? `Sorry, only ${availableSeats} seat(s) are available around this time.`
                                    : "Sorry, this time slot is fully booked."

                        };

                    }


                    // =============================================
                    // INSERT RESERVATION
                    // =============================================

                    const insert =
                        db.prepare(`
                            INSERT INTO reservations
                            (
                                name,
                                phone,
                                date,
                                time,
                                guests,
                                message,
                                status
                            )
                            VALUES (?, ?, ?, ?, ?, ?, 'Pending')
                        `);


                    const result =
                        insert.run(

                            cleanName,

                            cleanPhone,

                            date,

                            time,

                            guestCount,

                            message
                                ? String(message).trim()
                                : null

                        );


                    // =============================================
                    // CREATE BOOKING ID
                    // =============================================

                    const bookingId =
                        createBookingId(
                            result.lastInsertRowid
                        );


                    // =============================================
                    // RETURN RESULT
                    // =============================================

                    return {

                        success: true,

                        bookingId:
                            bookingId,

                        availableAfterBooking:
                            availableSeats -
                            guestCount

                    };

                });


            // =================================================
            // CAPACITY FAILURE
            // =================================================

            if (!createReservation.success) {

                return res.status(409).json({

                    success: false,

                    available:
                        createReservation.available,

                    booked:
                        createReservation.booked,

                    capacity:
                        createReservation.capacity,

                    message:
                        createReservation.message

                });

            }


            // =================================================
            // SUCCESS
            // =================================================

            return res.json({

                success: true,

                message:
                    "Reservation saved successfully!",

                bookingId:
                    createReservation.bookingId,

                availableAfterBooking:
                    createReservation.availableAfterBooking

            });

        } catch (error) {

            console.error(
                "Reservation database error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Could not save reservation."

            });

        }

    }
);


// =====================================================
// DELETE RESERVATION
// ADMIN ONLY
// =====================================================

app.delete(
    "/api/reservations/:id",
    requireAdmin,
    (req, res) => {

        const id =
            req.params.id;


        try {

            const result =
                db
                    .prepare(`
                        DELETE FROM reservations
                        WHERE id = ?
                    `)
                    .run(id);


            if (result.changes === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Reservation not found."

                });

            }


            return res.json({

                success: true,

                message:
                    "Reservation deleted successfully."

            });

        } catch (error) {

            console.error(
                "Database error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Could not delete reservation."

            });

        }

    }
);


// =====================================================
// UPDATE RESERVATION STATUS
// ADMIN ONLY
// =====================================================

app.post(
    "/api/reservations/:id/status",
    requireAdmin,
    (req, res) => {

        const id =
            req.params.id;

        const status =
            req.body.status;


        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Cancelled"
        ];


        if (
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid reservation status."

            });

        }


        try {

            const result =
                db
                    .prepare(`
                        UPDATE reservations
                        SET status = ?
                        WHERE id = ?
                    `)
                    .run(
                        status,
                        id
                    );


            if (result.changes === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Reservation not found."

                });

            }


            return res.json({

                success: true,

                message:
                    "Reservation status updated."

            });

        } catch (error) {

            console.error(
                "Database error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Could not update reservation."

            });

        }

    }
);


// =====================================================
// VERIFY CUSTOMER BOOKING
// =====================================================

app.post(
    "/api/verify-booking",
    verificationRateLimit,
    (req, res) => {

        const {
            bookingId,
            phone
        } = req.body;


        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (
            !bookingId ||
            !phone
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Booking ID and phone number are required."

            });

        }


        const cleanBookingId =
            String(bookingId)
                .trim()
                .toUpperCase();


        const cleanPhone =
            String(phone)
                .trim();


        // =================================================
        // BOOKING ID FORMAT
        // =================================================

        if (!/^MB\d{4}$/.test(cleanBookingId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid Booking ID."

            });

        }


        // =================================================
        // PHONE FORMAT
        // =================================================

        if (!/^[0-9]{10}$/.test(cleanPhone)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid 10-digit phone number."

            });

        }


        // MB0035 → 35
        const reservationId =
            Number(
                cleanBookingId.substring(2)
            );


        try {

            const reservation =
                db
                    .prepare(`
                        SELECT
                            id,
                            name,
                            phone,
                            date,
                            time,
                            guests,
                            message,
                            status
                        FROM reservations
                        WHERE id = ?
                        AND phone = ?
                    `)
                    .get(
                        reservationId,
                        cleanPhone
                    );


            // =================================================
            // INVALID BOOKING
            // =================================================

            if (!reservation) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Booking ID or phone number is incorrect."

                });

            }


            // =================================================
            // CANCELLED BOOKING
            // =================================================

            if (
                reservation.status ===
                "Cancelled"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This reservation has already been cancelled."

                });

            }


            // =================================================
            // SUCCESS
            // =================================================

            return res.json({

                success: true,

                message:
                    "Booking verified successfully.",

                reservation: {

                    bookingId:
                        createBookingId(
                            reservation.id
                        ),

                    name:
                        reservation.name,

                    phone:
                        reservation.phone,

                    date:
                        reservation.date,

                    time:
                        reservation.time,

                    guests:
                        reservation.guests,

                    message:
                        reservation.message,

                    status:
                        reservation.status

                }

            });

        } catch (error) {

            console.error(
                "Booking verification error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Could not verify booking."

            });

        }

    }
);


// =====================================================
// CUSTOMER RESCHEDULE
// BOOKING ID + PHONE REQUIRED
// =====================================================

app.post(
    "/api/customer/reschedule",
    customerRateLimit,
    (req, res) => {

        const {
            bookingId,
            phone,
            newDate,
            newTime
        } = req.body;


        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (
            !bookingId ||
            !phone ||
            !newDate ||
            !newTime
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Booking ID, phone, new date and new time are required."

            });

        }


        const cleanBookingId =
            String(bookingId)
                .trim()
                .toUpperCase();


        const cleanPhone =
            String(phone)
                .trim();


        // =================================================
        // BOOKING ID VALIDATION
        // =================================================

        if (!/^MB\d{4}$/.test(cleanBookingId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid Booking ID."

            });

        }


        // =================================================
        // PHONE VALIDATION
        // =================================================

        if (!/^[0-9]{10}$/.test(cleanPhone)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid 10-digit phone number."

            });

        }


        // =================================================
        // DATE VALIDATION
        // =================================================

        if (!isValidDate(newDate)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please select a valid date."

            });

        }


        if (isPastDate(newDate)) {

            return res.status(400).json({

                success: false,

                message:
                    "You cannot reschedule to a past date."

            });

        }


        // =================================================
        // TIME VALIDATION
        // =================================================

        if (!isValidReservationTime(newTime)) {

            return res.status(400).json({

                success: false,

                message:
                    "Our café accepts reservations from 8:00 AM to 8:30 PM."

            });

        }


        const reservationId =
            Number(
                cleanBookingId.substring(2)
            );


        try {

            // =================================================
            // FIND CUSTOMER RESERVATION
            // =================================================

            const reservation =
                db
                    .prepare(`
                        SELECT *
                        FROM reservations
                        WHERE id = ?
                        AND phone = ?
                    `)
                    .get(
                        reservationId,
                        cleanPhone
                    );


            // =================================================
            // INVALID BOOKING
            // =================================================

            if (!reservation) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Booking ID or phone number is incorrect."

                });

            }


            // =================================================
            // STATUS CHECK
            // =================================================

            if (
                reservation.status ===
                "Cancelled"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Cancelled reservations cannot be rescheduled."

                });

            }


            // =================================================
            // SAME TIME CHECK
            // =================================================

            if (
                reservation.date === newDate &&
                reservation.time === newTime
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your reservation is already scheduled for this date and time."

                });

            }


            const newStart =
                timeToMinutes(newTime);


            // =================================================
            // CHECK OTHER RESERVATIONS
            // =================================================

            const reservations =
                db
                    .prepare(`
                        SELECT
                            id,
                            time,
                            guests
                        FROM reservations
                        WHERE date = ?
                        AND id != ?
                        AND status IN ('Pending', 'Confirmed')
                    `)
                    .all(
                        newDate,
                        reservation.id
                    );


            let bookedGuests = 0;


            reservations.forEach(
                (otherReservation) => {

                    const existingStart =
                        timeToMinutes(
                            otherReservation.time
                        );


                    if (
                        reservationsOverlap(
                            newStart,
                            existingStart
                        )
                    ) {

                        bookedGuests +=
                            Number(
                                otherReservation.guests
                            );

                    }

                }
            );


            // =================================================
            // AVAILABLE SEATS
            // =================================================

            const availableSeats =
                MAX_CAPACITY -
                bookedGuests;


            // =================================================
            // CAPACITY CHECK
            // =================================================

            if (
                reservation.guests >
                availableSeats
            ) {

                return res.status(409).json({

                    success: false,

                    available:
                        Math.max(
                            availableSeats,
                            0
                        ),

                    booked:
                        bookedGuests,

                    capacity:
                        MAX_CAPACITY,

                    message:
                        availableSeats > 0
                            ? `Sorry, only ${availableSeats} seat(s) are available around this time.`
                            : "Sorry, this time slot is fully booked."

                });

            }


            // =================================================
            // SAME CUSTOMER OVERLAP CHECK
            // =================================================

            const customerReservations =
                db
                    .prepare(`
                        SELECT id, time
                        FROM reservations
                        WHERE phone = ?
                        AND date = ?
                        AND id != ?
                        AND status IN ('Pending', 'Confirmed')
                    `)
                    .all(
                        cleanPhone,
                        newDate,
                        reservation.id
                    );


            const duplicateOverlap =
                customerReservations.some(
                    (otherReservation) => {

                        const existingStart =
                            timeToMinutes(
                                otherReservation.time
                            );


                        return reservationsOverlap(
                            newStart,
                            existingStart
                        );

                    }
                );


            if (duplicateOverlap) {

                return res.status(409).json({

                    success: false,

                    message:
                        "You already have another reservation around this time."

                });

            }


            // =================================================
            // UPDATE RESERVATION
            // =================================================

            const update =
                db.prepare(`
                    UPDATE reservations
                    SET date = ?,
                        time = ?
                    WHERE id = ?
                    AND phone = ?
                    AND status IN ('Pending', 'Confirmed')
                `);


            const result =
                update.run(
                    newDate,
                    newTime,
                    reservation.id,
                    cleanPhone
                );


            if (result.changes === 0) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Reservation could not be updated."

                });

            }


            // =================================================
            // GET UPDATED RESERVATION
            // =================================================

            const updatedReservation =
                db
                    .prepare(`
                        SELECT *
                        FROM reservations
                        WHERE id = ?
                    `)
                    .get(
                        reservation.id
                    );


            // =================================================
            // SUCCESS
            // =================================================

            return res.json({

                success: true,

                message:
                    "Reservation rescheduled successfully.",

                reservation: {

                    bookingId:
                        createBookingId(
                            updatedReservation.id
                        ),

                    name:
                        updatedReservation.name,

                    phone:
                        updatedReservation.phone,

                    date:
                        updatedReservation.date,

                    time:
                        updatedReservation.time,

                    guests:
                        updatedReservation.guests,

                    message:
                        updatedReservation.message,

                    status:
                        updatedReservation.status

                }

            });

        } catch (error) {

            console.error(
                "Customer reschedule error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Could not reschedule reservation."

            });

        }

    }
);


// =====================================================
// CUSTOMER CANCEL RESERVATION
// BOOKING ID + PHONE REQUIRED
// =====================================================

app.post(
    "/api/customer/cancel",
    customerRateLimit,
    (req, res) => {

        const {
            bookingId,
            phone
        } = req.body;


        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (
            !bookingId ||
            !phone
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Booking ID and phone number are required."

            });

        }


        const cleanBookingId =
            String(bookingId)
                .trim()
                .toUpperCase();


        const cleanPhone =
            String(phone)
                .trim();


        // =================================================
        // BOOKING ID VALIDATION
        // =================================================

        if (!/^MB\d{4}$/.test(cleanBookingId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid Booking ID."

            });

        }


        // =================================================
        // PHONE VALIDATION
        // =================================================

        if (!/^[0-9]{10}$/.test(cleanPhone)) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid 10-digit phone number."

            });

        }


        const reservationId =
            Number(
                cleanBookingId.substring(2)
            );


        try {

            // =================================================
            // VERIFY OWNERSHIP
            // =================================================

            const reservation =
                db
                    .prepare(`
                        SELECT *
                        FROM reservations
                        WHERE id = ?
                        AND phone = ?
                    `)
                    .get(
                        reservationId,
                        cleanPhone
                    );


            if (!reservation) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Booking ID or phone number is incorrect."

                });

            }


            // =================================================
            // ALREADY CANCELLED
            // =================================================

            if (
                reservation.status ===
                "Cancelled"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This reservation has already been cancelled."

                });

            }


            // =================================================
            // CANCEL RESERVATION
            // =================================================

            const result =
                db
                    .prepare(`
                        UPDATE reservations
                        SET status = 'Cancelled'
                        WHERE id = ?
                        AND phone = ?
                        AND status IN ('Pending', 'Confirmed')
                    `)
                    .run(
                        reservationId,
                        cleanPhone
                    );


            if (result.changes === 0) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Reservation could not be cancelled."

                });

            }


            // =================================================
            // SUCCESS
            // =================================================

            return res.json({

                success: true,

                message:
                    "Reservation cancelled successfully."

            });

        } catch (error) {

            console.error(
                "Customer cancellation error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Could not cancel reservation."

            });

        }

    }
);


// =====================================================
// START SERVER
// =====================================================



app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mellow Bean server running on port ${PORT}`);
});
    