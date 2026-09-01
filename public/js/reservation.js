const reservationForm = document.getElementById("reservationForm");
const successMessage = document.getElementById("reservationSuccess");

const errorPopup = document.getElementById("errorPopup");
const errorMessage = document.getElementById("errorMessage");

const availabilityMessage =
    document.getElementById("availabilityMessage");

const dateInput =
    document.getElementById("date");

const timeInput =
    document.getElementById("time");

const guestsInput =
    document.getElementById("guests");

const submitButton =
    reservationForm.querySelector(".reservation-btn");


// =========================
// ERROR POPUP
// =========================

function showErrorPopup(message) {

    errorMessage.textContent = message;

    errorPopup.classList.add("show");

}


function closeErrorPopup() {

    errorPopup.classList.remove("show");

}


// =========================
// CHECK AVAILABILITY
// =========================

async function checkAvailability() {

    const date = dateInput.value;
    const time = timeInput.value;

    // Nothing selected yet
    if (!date || !time) {

        availabilityMessage.textContent = "";

        return;

    }


    availabilityMessage.textContent =
        "Checking availability...";

    availabilityMessage.className =
        "availability-message";


    try {

        const response = await fetch(
            `/api/availability?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`
        );


        const result =
            await response.json();


        console.log(
            "Availability:",
            result
        );


        // =========================
        // SERVER ERROR
        // =========================

        if (!response.ok || !result.success) {

            availabilityMessage.textContent =
                result.message ||
                "Could not check availability.";

            availabilityMessage.classList.add(
                "availability-error"
            );

            return;

        }


        // =========================
        // FULLY BOOKED
        // =========================

        if (result.available === 0) {

            availabilityMessage.textContent =
                "🔴 Fully booked for this time.";

            availabilityMessage.classList.add(
                "availability-full"
            );

            checkGuestAvailability();

            return;

        }


        // =========================
        // AVAILABLE
        // =========================

        availabilityMessage.textContent =
            `🟢 ${result.available} seat(s) available for this time.`;

        availabilityMessage.classList.add(
            "availability-good"
        );


        checkGuestAvailability();


    } catch (error) {

        console.error(
            "Availability error:",
            error
        );

        availabilityMessage.textContent =
            "Unable to check availability.";

        availabilityMessage.classList.add(
            "availability-error"
        );

    }

}


// =========================
// CHECK GUEST COUNT
// =========================

async function checkGuestAvailability() {

    const date = dateInput.value;
    const time = timeInput.value;
    const guests = Number(guestsInput.value);


    if (!date || !time || !guests) {

        return;

    }


    try {

        const response = await fetch(
            `/api/availability?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`
        );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            return;

        }


        // =========================
        // NOT ENOUGH SEATS
        // =========================

        if (guests > result.available) {

            availabilityMessage.textContent =
                `🔴 Only ${result.available} seat(s) available. You selected ${guests} guests.`;

            availabilityMessage.className =
                "availability-message availability-full";

            submitButton.disabled = true;

            return;

        }


        // =========================
        // ENOUGH SEATS
        // =========================

        submitButton.disabled = false;

        availabilityMessage.textContent =
            `🟢 ${result.available} seat(s) available.`;

        availabilityMessage.className =
            "availability-message availability-good";


    } catch (error) {

        console.error(
            "Guest availability error:",
            error
        );

    }

}


// =========================
// DATE CHANGE
// =========================

dateInput.addEventListener(
    "change",
    checkAvailability
);


// =========================
// TIME CHANGE
// =========================

timeInput.addEventListener(
    "change",
    checkAvailability
);


// =========================
// GUEST CHANGE
// =========================

guestsInput.addEventListener(
    "change",
    checkGuestAvailability
);


// =========================
// FORM SUBMIT
// =========================

reservationForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // =========================
        // COLLECT DATA
        // =========================

        const reservationData = {

            name:
                document
                    .getElementById("name")
                    .value
                    .trim(),

            phone:
                document
                    .getElementById("phone")
                    .value
                    .trim(),

            date:
                dateInput.value,

            time:
                timeInput.value,

            guests:
                guestsInput.value,

            message:
                document
                    .getElementById("message")
                    .value
                    .trim()

        };


        // =========================
        // DISABLE BUTTON
        // =========================

        submitButton.disabled = true;

        submitButton.textContent =
            "Booking...";


        try {

            const response =
                await fetch(
                    "/api/reservations",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                reservationData
                            )

                    }
                );


            const result =
                await response.json();


            console.log(
                "Server response:",
                result
            );


            // =========================
            // SUCCESS
            // =========================

            if (
                response.ok &&
                result.success
            ) {

                // Show name
                document
                    .getElementById(
                        "confirmedName"
                    )
                    .textContent =
                    reservationData.name;


                // Show date
                document
                    .getElementById(
                        "confirmedDate"
                    )
                    .textContent =
                    new Date(
                        reservationData.date +
                        "T00:00:00"
                    ).toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        }
                    );


                // Show time
                document
                    .getElementById(
                        "confirmedTime"
                    )
                    .textContent =
                    new Date(
                        "1970-01-01T" +
                        reservationData.time
                    ).toLocaleTimeString(
                        "en-IN",
                        {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                        }
                    );


                // Show guests
                document
                    .getElementById(
                        "confirmedGuests"
                    )
                    .textContent =
                    reservationData.guests +
                    (
                        reservationData.guests === "1"
                            ? " Guest"
                            : " Guests"
                    );
 // =========================
    // SHOW BOOKING ID
    // =========================

    document
        .getElementById("confirmedBookingId")
        .textContent =
        result.bookingId;

                // Show success
                successMessage.style.display =
                    "block";


                reservationForm.reset();


                availabilityMessage.textContent =
                    "";


                successMessage.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });


                submitButton.textContent =
                    "Reservation Confirmed ✓";


                return;

            }


            // =========================
            // CAPACITY / DUPLICATE
            // =========================

            if (response.status === 409) {

                showErrorPopup(
                    result.message ||
                    "This reservation cannot be made."
                );

                return;

            }


            // =========================
            // OTHER SERVER ERROR
            // =========================

            showErrorPopup(
                result.message ||
                "Something went wrong. Please try again."
            );


        } catch (error) {

            console.error(
                "Reservation request failed:",
                error
            );


            showErrorPopup(
                "Unable to connect to the server. Please try again."
            );


        } finally {

            // =========================
            // RESTORE BUTTON
            // =========================

            if (
                submitButton.textContent ===
                "Booking..."
            ) {

                submitButton.textContent =
                    "Reserve My Table";

            }


            // Only enable if there isn't
            // an insufficient-seat situation
            if (
                !availabilityMessage.classList.contains(
                    "availability-full"
                )
            ) {

                submitButton.disabled =
                    false;

            }

        }

    }
);