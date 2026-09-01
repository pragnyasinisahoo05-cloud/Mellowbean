

// =========================
// CONTACT FORM
// =========================

const contactForm = document.querySelector(".contact-form");

if (contactForm) {

    contactForm.addEventListener("submit", function(event) {

        event.preventDefault();

        alert("Thank you for contacting Mellow Bean Café! ❤️");

        contactForm.reset();

    });

}