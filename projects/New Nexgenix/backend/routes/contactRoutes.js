const express = require("express");
const router = express.Router();

// Example POST route for a contact form
router.post("/", (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation (you can extend this)
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Simulate saving data to the database (implement your own logic here)
  console.log("Contact form submitted:", { name, email, message });

  res.status(200).json({ message: "Contact form submitted successfully" });
});

module.exports = router;
