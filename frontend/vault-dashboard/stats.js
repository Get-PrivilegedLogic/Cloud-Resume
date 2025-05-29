
fetch("https://l7vwmrxys3.execute-api.us-east-1.amazonaws.com/prod/stats")
    .then(response => response.json())
    .then(data => {
        const ctx = document.getElementById("platformChart").getContext("2d");
        const labels = Object.keys(data.platform_counts);
        const counts = Object.values(data.platform_counts);

        const chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Unique Accounts",
                    data: counts,
                    backgroundColor: "#3498db"
                }]
            },
            options: {
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const platform = labels[index];
                        showFailedAccounts(platform, data.failed_accounts_by_platform[platform]);
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                }
            }
        });
    })
    .catch(error => {
        console.error("Error fetching stats:", error);
    });

function showFailedAccounts(platform, accounts) {
    document.getElementById("selectedPlatform").textContent = platform;
    const list = document.getElementById("failedAccountsList");
    list.innerHTML = "";
    if (accounts && accounts.length) {
        accounts.forEach(account => {
            const li = document.createElement("li");
            li.textContent = account;
            list.appendChild(li);
        });
    } else {
        const li = document.createElement("li");
        li.textContent = "No failed accounts.";
        list.appendChild(li);
    }
}
