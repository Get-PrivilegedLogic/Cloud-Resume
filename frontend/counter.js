fetch("https://ynge0eu21i.execute-api.us-east-1.amazonaws.com/prod/count")
  .then(response => response.json())
  .then(data => {
    document.getElementById("visitor-count").textContent = data.count;
  })
  .catch(error => {
    console.error("Visitor count failed:", error);
    document.getElementById("visitor-count").textContent = "N/A";
  });
