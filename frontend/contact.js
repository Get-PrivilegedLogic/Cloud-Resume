
import { CONFIG } from './config.js';

document.getElementById('contact-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const button = this.querySelector("button");
  button.disabled = true;
  button.textContent = "Sending...";

  const data = {
    name: this.name.value.trim(),
    email: this.email.value.trim(),
    message: this.message.value.trim()
  };

  if (!/\S+@\S+\.\S+/.test(data.email)) {
    document.getElementById('form-response').textContent = "Please enter a valid email address.";
    button.disabled = false;
    button.textContent = "Send Message";
    return;
  }

  try {
    const response = await fetch(CONFIG.API_ENDPOINTS.CONTACT_FORM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    document.getElementById('form-response').textContent = result.message || "Thanks for your message!";

    // Clear the form fields
    this.name.value = '';
    this.email.value = '';
    this.message.value = '';
  } catch (error) {
    console.error("Form submission error:", error);
    document.getElementById('form-response').textContent = "There was an error sending your message.";
  } finally {
    button.disabled = false;
    button.textContent = "Send Message";
  }
});
