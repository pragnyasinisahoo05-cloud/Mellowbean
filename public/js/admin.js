// =====================================================
// ADMIN DASHBOARD
// =====================================================


// =========================
// DOM ELEMENTS
// =========================

const todayDate =
    document.getElementById("todayDate");

const todayReservations =
    document.getElementById("todayReservations");

const reservationTable =
    document.getElementById("reservationTable");

const searchReservations =
    document.getElementById("searchReservations");

const statusFilter =
    document.getElementById("statusFilter");

const dateFilter =
    document.getElementById("dateFilter");

const customDate =
    document.getElementById("customDate");

const totalReservations =
    document.getElementById("totalReservations");

const pendingReservations =
    document.getElementById("pendingReservations");

const confirmedReservations =
    document.getElementById("confirmedReservations");

const logoutBtn =
    document.getElementById("logoutBtn");


// =========================
// STORE RESERVATIONS
// =========================

let allReservations = [];


// =====================================================
// LOAD RESERVATIONS
// =====================================================

async function loadReservations() {

    try {

        const response =
            await fetch("/api/reservations");

        const data =
            await response.json();


        // =========================
        // AUTHENTICATION CHECK
        // =========================

        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;

        }


        if (!data.success) {

            throw new Error(
                "Could not load reservations"
            );

        }


        allReservations =
            data.reservations || [];


        // =========================
        // UPDATE DASHBOARD
        // =========================

        displayTodayReservations();


        // =========================
        // DASHBOARD STATS
        // =========================

        const total =
            allReservations.length;


        const confirmed =
            allReservations.filter(
                reservation =>
                    (reservation.status || "Pending") ===
                    "Confirmed"
            ).length;


        const pending =
            allReservations.filter(
                reservation =>
                    (reservation.status || "Pending") ===
                    "Pending"
            ).length;


        totalReservations.textContent =
            total;

        pendingReservations.textContent =
            pending;

        confirmedReservations.textContent =
            confirmed;


        // =========================
        // DISPLAY ALL RESERVATIONS
        // =========================

        displayReservations(
            allReservations
        );


    } catch (error) {

        console.error(
            "Load reservations error:",
            error
        );


        reservationTable.innerHTML = "";

        const row =
            document.createElement("tr");

        const cell =
            document.createElement("td");

        cell.colSpan = 9;

        cell.textContent =
            "Unable to load reservations.";

        row.appendChild(cell);

        reservationTable.appendChild(row);

    }

}


// =====================================================
// DISPLAY RESERVATIONS
// =====================================================

function displayReservations(reservations) {

    // Clear old rows

    reservationTable.innerHTML = "";


    // =========================
    // NO RESERVATIONS
    // =========================

    if (reservations.length === 0) {

        const row =
            document.createElement("tr");

        const cell =
            document.createElement("td");

        cell.colSpan = 9;

        cell.textContent =
            "No matching reservations found.";

        row.appendChild(cell);

        reservationTable.appendChild(row);

        return;

    }


    // =========================
    // CREATE ROWS
    // =========================

    reservations.forEach(
        reservation => {

            const row =
                document.createElement("tr");


            const status =
                reservation.status || "Pending";


            // =================================================
            // ID
            // =================================================

            const idCell =
                document.createElement("td");

            idCell.textContent =
                reservation.id;


            // =================================================
            // NAME
            // =================================================

            const nameCell =
                document.createElement("td");

            nameCell.textContent =
                reservation.name || "—";


            // =================================================
            // PHONE
            // =================================================

            const phoneCell =
                document.createElement("td");

            phoneCell.textContent =
                reservation.phone || "—";


            // =================================================
            // DATE
            // =================================================

            const dateCell =
                document.createElement("td");

            dateCell.textContent =
                reservation.date || "—";


            // =================================================
            // TIME
            // =================================================

            const timeCell =
                document.createElement("td");

            timeCell.textContent =
                reservation.time || "—";


            // =================================================
            // GUESTS
            // =================================================

            const guestsCell =
                document.createElement("td");

            guestsCell.textContent =
                reservation.guests ?? "—";


            // =================================================
            // MESSAGE
            // =================================================

            const messageCell =
                document.createElement("td");

            messageCell.textContent =
                reservation.message || "—";


            // =================================================
            // STATUS
            // =================================================

            const statusCell =
                document.createElement("td");


            const statusBadge =
                document.createElement("span");

            statusBadge.className =
                `status-badge ${status.toLowerCase()}`;

            statusBadge.textContent =
                status;

            statusCell.appendChild(
                statusBadge
            );


            // =================================================
            // ACTIONS
            // =================================================

            const actionsCell =
                document.createElement("td");


            // =========================
            // PENDING
            // =========================

            if (status === "Pending") {

                const confirmButton =
                    document.createElement("button");

                confirmButton.className =
                    "confirm-btn";

                confirmButton.textContent =
                    "✅ Confirm";

                confirmButton.addEventListener(
                    "click",
                    () => {
                        updateStatus(
                            reservation.id,
                            "Confirmed"
                        );
                    }
                );


                const cancelButton =
                    document.createElement("button");

                cancelButton.className =
                    "cancel-btn";

                cancelButton.textContent =
                    "❌ Cancel";

                cancelButton.addEventListener(
                    "click",
                    () => {
                        updateStatus(
                            reservation.id,
                            "Cancelled"
                        );
                    }
                );


                actionsCell.appendChild(
                    confirmButton
                );

                actionsCell.appendChild(
                    cancelButton
                );

            }


            // =========================
            // CONFIRMED
            // =========================

            else if (status === "Confirmed") {

                const confirmedText =
                    document.createElement("span");

                confirmedText.className =
                    "confirmed-text";

                confirmedText.textContent =
                    "✓ Confirmed";


                const cancelButton =
                    document.createElement("button");

                cancelButton.className =
                    "cancel-btn";

                cancelButton.textContent =
                    "❌ Cancel";

                cancelButton.addEventListener(
                    "click",
                    () => {
                        updateStatus(
                            reservation.id,
                            "Cancelled"
                        );
                    }
                );


                actionsCell.appendChild(
                    confirmedText
                );

                actionsCell.appendChild(
                    cancelButton
                );

            }


            // =========================
            // CANCELLED
            // =========================

            else if (status === "Cancelled") {

                const cancelledText =
                    document.createElement("span");

                cancelledText.className =
                    "cancelled-text";

                cancelledText.textContent =
                    "✕ Cancelled";


                actionsCell.appendChild(
                    cancelledText
                );

            }


            // =================================================
            // DELETE BUTTON
            // =================================================

            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "delete-btn";

            deleteButton.textContent =
                "🗑️ Delete";

            deleteButton.addEventListener(
                "click",
                () => {
                    deleteReservation(
                        reservation.id
                    );
                }
            );


            actionsCell.appendChild(
                deleteButton
            );


            // =================================================
            // APPEND CELLS
            // =================================================

            row.appendChild(idCell);

            row.appendChild(nameCell);

            row.appendChild(phoneCell);

            row.appendChild(dateCell);

            row.appendChild(timeCell);

            row.appendChild(guestsCell);

            row.appendChild(messageCell);

            row.appendChild(statusCell);

            row.appendChild(actionsCell);


            reservationTable.appendChild(
                row
            );

        }
    );

}


// =====================================================
// DELETE RESERVATION
// =====================================================

async function deleteReservation(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to permanently delete this reservation?"
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/reservations/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        // =========================
        // AUTH CHECK
        // =========================

        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;

        }


        if (!data.success) {

            alert(
                data.message ||
                "Could not delete reservation."
            );

            return;

        }


        alert(
            "Reservation deleted successfully! ☕"
        );


        // Reload dashboard

        loadReservations();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "Something went wrong while deleting the reservation."
        );

    }

}


// =====================================================
// UPDATE RESERVATION STATUS
// =====================================================

async function updateStatus(id, status) {

    // =========================
    // CONFIRMATION MESSAGE
    // =========================

    let confirmationMessage;


    if (status === "Confirmed") {

        confirmationMessage =
            "Confirm this reservation?";

    }


    else if (status === "Cancelled") {

        confirmationMessage =
            "Cancel this reservation? The seats will become available again.";

    }


    const confirmed =
        confirm(
            confirmationMessage
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/reservations/${id}/status`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        status: status

                    })

                }
            );


        const data =
            await response.json();


        // =========================
        // AUTH CHECK
        // =========================

        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;

        }


        if (!data.success) {

            alert(
                data.message ||
                "Could not update reservation status."
            );

            return;

        }


        // =========================
        // SUCCESS MESSAGE
        // =========================

        if (status === "Confirmed") {

            alert(
                "Reservation confirmed! ☕"
            );

        }


        else if (status === "Cancelled") {

            alert(
                "Reservation cancelled. The seats are available again."
            );

        }


        // Reload dashboard

        loadReservations();


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            "Something went wrong while updating the reservation."
        );

    }

}


// =====================================================
// SEARCH + STATUS + DATE FILTER
// =====================================================

function filterReservations() {

    const searchText =
        searchReservations.value
            .toLowerCase()
            .trim();


    const selectedStatus =
        statusFilter.value;


    const selectedDate =
        dateFilter.value;


    // =========================
    // TODAY
    // =========================

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    const todayString =
        `${year}-${month}-${day}`;


    // =========================
    // TOMORROW
    // =========================

    const tomorrowDate =
        new Date(today);


    tomorrowDate.setDate(
        tomorrowDate.getDate() + 1
    );


    const tomorrowYear =
        tomorrowDate.getFullYear();


    const tomorrowMonth =
        String(
            tomorrowDate.getMonth() + 1
        ).padStart(2, "0");


    const tomorrowDay =
        String(
            tomorrowDate.getDate()
        ).padStart(2, "0");


    const tomorrowString =
        `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;


    // =========================
    // FILTER
    // =========================

    const filteredReservations =
        allReservations.filter(
            reservation => {

                const name =
                    (reservation.name || "")
                        .toLowerCase();


                const phone =
                    (reservation.phone || "")
                        .toLowerCase();


                const reservationStatus =
                    reservation.status ||
                    "Pending";


                // SEARCH

                const matchesSearch =
                    name.includes(searchText) ||
                    phone.includes(searchText);


                // STATUS

                const matchesStatus =
                    selectedStatus === "all" ||
                    reservationStatus ===
                        selectedStatus;


                // DATE

                let matchesDate = true;


                // TODAY

                if (
                    selectedDate ===
                    "today"
                ) {

                    matchesDate =
                        reservation.date ===
                        todayString;

                }


                // TOMORROW

                else if (
                    selectedDate ===
                    "tomorrow"
                ) {

                    matchesDate =
                        reservation.date ===
                        tomorrowString;

                }


                // CUSTOM DATE

                else if (
                    selectedDate ===
                    "custom"
                ) {

                    matchesDate =
                        reservation.date ===
                        customDate.value;

                }


                return (

                    matchesSearch &&
                    matchesStatus &&
                    matchesDate

                );

            }
        );


    displayReservations(
        filteredReservations
    );

}


// =====================================================
// FILTER EVENTS
// =====================================================

searchReservations.addEventListener(
    "input",
    filterReservations
);


statusFilter.addEventListener(
    "change",
    filterReservations
);


dateFilter.addEventListener(
    "change",
    () => {

        if (
            dateFilter.value ===
            "custom"
        ) {

            customDate.style.display =
                "block";

        }

        else {

            customDate.style.display =
                "none";

            customDate.value = "";

        }


        filterReservations();

    }
);


customDate.addEventListener(
    "change",
    filterReservations
);


// =====================================================
// TODAY'S RESERVATIONS
// =====================================================

function displayTodayReservations() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    const todayString =
        `${year}-${month}-${day}`;


    // =========================
    // DISPLAY TODAY'S DATE
    // =========================

    todayDate.textContent =
        today.toLocaleDateString(
            "en-IN",
            {

                day: "numeric",

                month: "short",

                year: "numeric"

            }
        );


    // =========================
    // FIND TODAY'S BOOKINGS
    // =========================

    const todaysBookings =
        allReservations.filter(
            reservation =>
                reservation.date ===
                todayString
        );


    todayReservations.innerHTML = "";


    // =========================
    // NO BOOKINGS
    // =========================

    if (
        todaysBookings.length ===
        0
    ) {

        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "today-empty";

        emptyMessage.textContent =
            "No reservations for today. ☕";


        todayReservations.appendChild(
            emptyMessage
        );

        return;

    }


    // =========================
    // DISPLAY BOOKINGS
    // =========================

    todaysBookings.forEach(
        reservation => {

            const status =
                reservation.status ||
                "Pending";


            const booking =
                document.createElement(
                    "div"
                );


            booking.className =
                "today-booking";


            // =========================
            // TIME
            // =========================

            const timeDiv =
                document.createElement("div");

            timeDiv.className =
                "today-booking-time";

            timeDiv.textContent =
                reservation.time || "—";


            // =========================
            // INFO
            // =========================

            const infoDiv =
                document.createElement("div");

            infoDiv.className =
                "today-booking-info";


            const nameHeading =
                document.createElement("h3");

            nameHeading.textContent =
                reservation.name || "—";


            const detailsParagraph =
                document.createElement("p");

            detailsParagraph.textContent =
                `${reservation.guests ?? "—"} guests · ${reservation.phone || "—"}`;


            infoDiv.appendChild(
                nameHeading
            );

            infoDiv.appendChild(
                detailsParagraph
            );


            // =========================
            // STATUS
            // =========================

            const statusBadge =
                document.createElement("span");

            statusBadge.className =
                `status-badge ${status.toLowerCase()}`;

            statusBadge.textContent =
                status;


            // =========================
            // BUILD BOOKING
            // =========================

            booking.appendChild(
                timeDiv
            );

            booking.appendChild(
                infoDiv
            );

            booking.appendChild(
                statusBadge
            );


            todayReservations.appendChild(
                booking
            );

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            const response =
                await fetch(
                    "/api/logout",
                    {
                        method: "POST"
                    }
                );


            const data =
                await response.json();


            if (data.success) {

                window.location.href =
                    "login.html";

            }

            else {

                alert(
                    data.message ||
                    "Could not logout."
                );

            }


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );


            alert(
                "Something went wrong while logging out."
            );

        }

    }
);


// =====================================================
// INITIAL LOAD
// =====================================================

loadReservations();