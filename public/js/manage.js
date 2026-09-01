// =========================
// ELEMENTS
// =========================

const verifyForm =
    document.getElementById("verifyForm");

const bookingIdInput =
    document.getElementById("bookingId");

const phoneInput =
    document.getElementById("phone");

const verifyButton =
    document.getElementById("verifyButton");

const manageError =
    document.getElementById("manageError");

const verificationCard =
    document.getElementById("verificationCard");

const reservationCard =
    document.getElementById("reservationCard");

const backButton =
    document.getElementById("backButton");

const rescheduleButton =
    document.getElementById("rescheduleButton");

const cancelButton =
    document.getElementById("cancelButton");


// =========================
// CURRENT RESERVATION
// =========================

let currentReservation = null;


// =========================
// SHOW ERROR
// =========================

function showError(message) {

    manageError.textContent = message;

    manageError.style.display = "block";

}


// =========================
// HIDE ERROR
// =========================

function hideError() {

    manageError.textContent = "";

    manageError.style.display = "none";

}


// =========================
// DISPLAY RESERVATION
// =========================

function displayReservation(reservation) {

    currentReservation = reservation;


    document.getElementById("displayBookingId")
        .textContent =
        reservation.bookingId;


    document.getElementById("displayName")
        .textContent =
        reservation.name;


    document.getElementById("displayPhone")
        .textContent =
        reservation.phone;


    document.getElementById("displayDate")
        .textContent =
        reservation.date;


    document.getElementById("displayTime")
        .textContent =
        reservation.time;


    document.getElementById("displayGuests")
        .textContent =
        reservation.guests +
        (
            reservation.guests === 1
                ? " Guest"
                : " Guests"
        );


    document.getElementById("displayMessage")
        .textContent =
        reservation.message || "None";


    document.getElementById("displayStatus")
        .textContent =
        reservation.status;


    // Hide verification form

    verificationCard.style.display =
        "none";


    // Show reservation

    reservationCard.style.display =
        "block";


    updateActionButtons();


    reservationCard.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });

}


// =========================
// UPDATE ACTION BUTTONS
// =========================

function updateActionButtons() {

    if (!currentReservation) {
        return;
    }


    const isCancelled =
        currentReservation.status === "Cancelled";


    if (isCancelled) {

        rescheduleButton.disabled = true;

        cancelButton.disabled = true;

        rescheduleButton.textContent =
            "Reschedule Unavailable";

        cancelButton.textContent =
            "Reservation Cancelled";

    } else {

        rescheduleButton.disabled = false;

        cancelButton.disabled = false;

        rescheduleButton.textContent =
            "Reschedule";

        cancelButton.textContent =
            "Cancel Reservation";

    }

}


// =========================
// VERIFY BOOKING
// =========================

verifyForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        hideError();


        // =========================
        // GET INPUT
        // =========================

        const bookingId =
            bookingIdInput.value
                .trim()
                .toUpperCase();


        const phone =
            phoneInput.value
                .trim();


        // =========================
        // CLIENT VALIDATION
        // =========================

        if (!/^MB\d{4}$/.test(bookingId)) {

            showError(
                "Please enter a valid Booking ID like MB0035."
            );

            return;

        }


        if (!/^[0-9]{10}$/.test(phone)) {

            showError(
                "Please enter a valid 10-digit phone number."
            );

            return;

        }


        // =========================
        // BUTTON
        // =========================

        verifyButton.disabled =
            true;

        verifyButton.textContent =
            "Checking...";


        try {

            const response =
                await fetch(
                    "/api/verify-booking",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                bookingId:
                                    bookingId,

                                phone:
                                    phone

                            })

                    }
                );


            const result =
                await response.json();


            console.log(
                "Booking verification:",
                result
            );


            // =========================
            // SUCCESS
            // =========================

            if (
                response.ok &&
                result.success
            ) {

                displayReservation(
                    result.reservation
                );

                return;

            }


            // =========================
            // ERROR
            // =========================

            showError(

                result.message ||
                "Could not find your reservation."

            );


        } catch (error) {

            console.error(
                "Verification error:",
                error
            );


            showError(
                "Unable to connect to the server. Please try again."
            );


        } finally {

            verifyButton.disabled =
                false;

            verifyButton.textContent =
                "Find My Reservation";

        }

    }
);


// =====================================================
// CREATE RESCHEDULE FORM
// =====================================================

function createRescheduleForm() {

    // Prevent duplicate form

    if (
        document.getElementById(
            "rescheduleForm"
        )
    ) {

        return;

    }


    const form =
        document.createElement("div");

    form.id =
        "rescheduleForm";

    form.style.marginTop =
        "25px";

    form.style.padding =
        "25px";

    form.style.background =
        "#0d0d0d";

    form.style.borderRadius =
        "15px";

    form.style.border =
        "1px solid #292929";


    // =========================
    // TITLE
    // =========================

    const title =
        document.createElement("h3");

    title.textContent =
        "Choose a New Time";

    title.style.marginBottom =
        "20px";

    title.style.fontFamily =
        '"Playfair Display", serif';

    form.appendChild(title);


    // =========================
    // DATE LABEL
    // =========================

    const dateLabel =
        document.createElement("label");

    dateLabel.textContent =
        "New Date";

    dateLabel.style.display =
        "block";

    dateLabel.style.marginBottom =
        "8px";

    form.appendChild(dateLabel);


    // =========================
    // DATE INPUT
    // =========================

    const dateInput =
        document.createElement("input");

    dateInput.type =
        "date";

    dateInput.id =
        "newReservationDate";

    dateInput.style.width =
        "100%";

    dateInput.style.boxSizing =
        "border-box";

    dateInput.style.padding =
        "14px";

    dateInput.style.marginBottom =
        "18px";

    dateInput.style.background =
        "#151515";

    dateInput.style.border =
        "1px solid #333";

    dateInput.style.borderRadius =
        "10px";

    dateInput.style.color =
        "white";

    form.appendChild(dateInput);


    // =========================
    // TIME LABEL
    // =========================

    const timeLabel =
        document.createElement("label");

    timeLabel.textContent =
        "New Time";

    timeLabel.style.display =
        "block";

    timeLabel.style.marginBottom =
        "8px";

    form.appendChild(timeLabel);


    // =========================
    // TIME INPUT
    // =========================

    const timeInput =
        document.createElement("input");

    timeInput.type =
        "time";

    timeInput.id =
        "newReservationTime";

    timeInput.style.width =
        "100%";

    timeInput.style.boxSizing =
        "border-box";

    timeInput.style.padding =
        "14px";

    timeInput.style.marginBottom =
        "18px";

    timeInput.style.background =
        "#151515";

    timeInput.style.border =
        "1px solid #333";

    timeInput.style.borderRadius =
        "10px";

    timeInput.style.color =
        "white";

    form.appendChild(timeInput);


    // =========================
    // AVAILABILITY MESSAGE
    // =========================

    const availabilityMessage =
        document.createElement("p");

    availabilityMessage.id =
        "rescheduleAvailability";

    availabilityMessage.style.fontSize =
        "13px";

    availabilityMessage.style.marginBottom =
        "15px";

    availabilityMessage.textContent =
        "Choose a date and time.";

    form.appendChild(
        availabilityMessage
    );


    // =========================
    // CONFIRM BUTTON
    // =========================

    const confirmButton =
        document.createElement("button");

    confirmButton.type =
        "button";

    confirmButton.textContent =
        "Confirm Reschedule";

    confirmButton.className =
        "action-btn";

    confirmButton.style.width =
        "100%";

    form.appendChild(
        confirmButton
    );


    // =========================
    // CLOSE BUTTON
    // =========================

    const closeButton =
        document.createElement("button");

    closeButton.type =
        "button";

    closeButton.textContent =
        "Keep Current Reservation";

    closeButton.className =
        "back-btn";

    closeButton.style.marginTop =
        "15px";

    closeButton.style.width =
        "100%";

    form.appendChild(
        closeButton
    );


    // =========================
    // MINIMUM DATE
    // =========================

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    dateInput.min =
        today;


    // =========================
    // DEFAULT CURRENT DATE
    // =========================

    dateInput.value =
        currentReservation.date;


    timeInput.value =
        currentReservation.time;


    // =========================
    // CLOSE
    // =========================

    closeButton.addEventListener(
        "click",
        function () {

            form.remove();

        }
    );


    // =========================
    // CHECK AVAILABILITY
    // =========================

    async function checkAvailability() {

        const date =
            dateInput.value;

        const time =
            timeInput.value;


        if (!date || !time) {

            availabilityMessage.textContent =
                "Please select both date and time.";

            availabilityMessage.style.color =
                "#d78383";

            confirmButton.disabled =
                true;

            return;

        }


        availabilityMessage.textContent =
            "Checking availability...";

        availabilityMessage.style.color =
            "#aaa";

        confirmButton.disabled =
            true;


        try {

            const response =
                await fetch(
                    `/api/availability?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`
                );


            const result =
                await response.json();


            if (
                response.ok &&
                result.success
            ) {

                if (
                    result.available >=
                    Number(
                        currentReservation.guests
                    )
                ) {

                    availabilityMessage.textContent =
                        `${result.available} seat(s) available. Your reservation needs ${currentReservation.guests} seat(s).`;

                    availabilityMessage.style.color =
                        "#8fd19e";

                    confirmButton.disabled =
                        false;

                } else {

                    availabilityMessage.textContent =
                        result.available > 0

                            ? `Only ${result.available} seat(s) are available. You need ${currentReservation.guests}.`

                            : "This time slot is fully booked.";

                    availabilityMessage.style.color =
                        "#d78383";

                    confirmButton.disabled =
                        true;

                }

            } else {

                availabilityMessage.textContent =
                    result.message ||
                    "Could not check availability.";

                availabilityMessage.style.color =
                    "#d78383";

                confirmButton.disabled =
                    true;

            }

        } catch (error) {

            console.error(
                "Availability error:",
                error
            );

            availabilityMessage.textContent =
                "Could not check availability. Please try again.";

            availabilityMessage.style.color =
                "#d78383";

            confirmButton.disabled =
                true;

        }

    }


    dateInput.addEventListener(
        "change",
        checkAvailability
    );


    timeInput.addEventListener(
        "change",
        checkAvailability
    );


    // =========================
    // CONFIRM RESCHEDULE
    // =========================

    confirmButton.addEventListener(
        "click",
        async function () {

            const newDate =
                dateInput.value;

            const newTime =
                timeInput.value;


            if (
                !newDate ||
                !newTime
            ) {

                return;

            }


            confirmButton.disabled =
                true;

            confirmButton.textContent =
                "Updating...";


            try {

                const response =
                    await fetch(
                        "/api/customer/reschedule",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    bookingId:
                                        currentReservation.bookingId,

                                    phone:
                                        currentReservation.phone,

                                    newDate:
                                        newDate,

                                    newTime:
                                        newTime

                                })

                        }
                    );


                const result =
                    await response.json();


                if (
                    response.ok &&
                    result.success
                ) {

                    form.remove();

                    displayReservation(
                        result.reservation
                    );

                    alert(
                        "Your reservation has been rescheduled successfully!"
                    );

                    return;

                }


                availabilityMessage.textContent =
                    result.message ||
                    "Could not reschedule your reservation.";

                availabilityMessage.style.color =
                    "#d78383";

                confirmButton.disabled =
                    false;

                confirmButton.textContent =
                    "Confirm Reschedule";

            } catch (error) {

                console.error(
                    "Reschedule error:",
                    error
                );

                availabilityMessage.textContent =
                    "Unable to connect to the server. Please try again.";

                availabilityMessage.style.color =
                    "#d78383";

                confirmButton.disabled =
                    false;

                confirmButton.textContent =
                    "Confirm Reschedule";

            }

        }
    );


    // Add form

    reservationCard.appendChild(
        form
    );


    // Initial availability check

    checkAvailability();

}


// =====================================================
// RESCHEDULE BUTTON
// =====================================================

rescheduleButton.addEventListener(
    "click",
    function () {

        hideError();


        if (!currentReservation) {

            showError(
                "Please verify your reservation first."
            );

            return;

        }


        if (
            currentReservation.status ===
            "Cancelled"
        ) {

            showError(
                "Cancelled reservations cannot be rescheduled."
            );

            return;

        }


        createRescheduleForm();

    }
);


// =====================================================
// CANCEL RESERVATION
// =====================================================

cancelButton.addEventListener(
    "click",
    async function () {

        hideError();


        if (!currentReservation) {

            showError(
                "Please verify your reservation first."
            );

            return;

        }


        if (
            currentReservation.status ===
            "Cancelled"
        ) {

            showError(
                "This reservation is already cancelled."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to cancel this reservation?"
            );


        if (!confirmed) {

            return;

        }


        cancelButton.disabled =
            true;

        cancelButton.textContent =
            "Cancelling...";


        try {

            const response =
                await fetch(
                    "/api/customer/cancel",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                bookingId:
                                    currentReservation.bookingId,

                                phone:
                                    currentReservation.phone

                            })

                    }
                );


            const result =
                await response.json();


            if (
                response.ok &&
                result.success
            ) {

                currentReservation.status =
                    "Cancelled";


                displayReservation(
                    currentReservation
                );


                alert(
                    "Your reservation has been cancelled successfully."
                );


                return;

            }


            showError(

                result.message ||
                "Could not cancel your reservation."

            );


        } catch (error) {

            console.error(
                "Cancellation error:",
                error
            );


            showError(
                "Unable to connect to the server. Please try again."
            );

        } finally {

            cancelButton.disabled =
                false;

            cancelButton.textContent =
                "Cancel Reservation";

            updateActionButtons();

        }

    }
);


// =====================================================
// SEARCH ANOTHER BOOKING
// =====================================================

backButton.addEventListener(
    "click",
    function () {

        reservationCard.style.display =
            "none";


        verificationCard.style.display =
            "block";


        currentReservation =
            null;


        verifyForm.reset();


        hideError();


        const rescheduleForm =
            document.getElementById(
                "rescheduleForm"
            );


        if (rescheduleForm) {

            rescheduleForm.remove();

        }


        updateActionButtons();


        bookingIdInput.focus();


        verificationCard.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });

    }
);