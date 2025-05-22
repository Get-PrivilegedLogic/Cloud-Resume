
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const data = {
    name: this.name.value,
    email: this.email.value,
    message: this.message.value
  };

  const response = await fetch('https://your-api-id.execute-api.region.amazonaws.com/contact', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });

  const result = await response.json();
  document.getElementById('form-response').textContent = result.message || "Thanks for your message!";
});
