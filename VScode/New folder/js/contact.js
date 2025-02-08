// Add event listener to handle form submission
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (name && email && message) {
        alert(`Thank you, ${name}! Your message has been received.`);
        contactForm.reset(); // Clear the form
    } else {
        alert('Please fill out all fields before submitting.');
    }
});
