const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch("/api/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                password: password
            })

        });

        const data = await response.json();

        if (data.success) {

            loginMessage.textContent = "Login successful! ☕";
            loginMessage.style.color = "#9BC79B";

            setTimeout(() => {

                window.location.href = "admin.html";

            }, 500);

        } else {

            loginMessage.textContent =
                data.message || "Invalid username or password.";

            loginMessage.style.color = "#D9A38F";

        }

    } catch (error) {

        console.error("Login error:", error);

        loginMessage.textContent =
            "Something went wrong. Please try again.";

        loginMessage.style.color = "#D9A38F";

    }

});