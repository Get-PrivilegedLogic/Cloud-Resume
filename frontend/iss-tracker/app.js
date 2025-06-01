// Initialize map and fit to container width
let map = L.map('map', {
    center: [0, 0],
    zoom: 1,  // Start at a lower zoom level
    scrollWheelZoom: false,
    zoomDelta: 0.5,
    zoomSnap: 0.5,
    worldCopyJump: true,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0
});

// Tile layer with noWrap to stop world duplication
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    noWrap: true,
    bounds: [[-90, -180], [90, 180]],
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Custom ISS icon
let issIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
    iconSize: [50, 32],
    iconAnchor: [25, 16]
});

let issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);

// Zoom control toggle button
const zoomToggle = L.control({ position: 'topright' });
zoomToggle.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const btn = L.DomUtil.create('a', '', div);
    btn.innerHTML = '🖱️ Zoom';
    btn.href = '#';
    btn.title = 'Enable scroll zoom temporarily';
    btn.style.fontSize = '18px';
    btn.onclick = function (e) {
        e.preventDefault();
        map.scrollWheelZoom.enable();
        setTimeout(() => {
            map.scrollWheelZoom.disable();
        }, 5000);
    };
    return div;
};
zoomToggle.addTo(map);

// Update ISS position and recenter
async function updateISS() {
    try {
        const response = await fetch('https://7lqytqrrzl.execute-api.us-east-1.amazonaws.com/prod/position');
        const data = await response.json();        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);

        // Update marker position
        issMarker.setLatLng([lat, lng]);
        
        // Handle date line crossing by checking current center and new position
        const currentCenter = map.getCenter();
        const lngDiff = Math.abs(currentCenter.lng - lng);
        
        // Only adjust view if we're not crossing the date line or user has manually panned
        if (lngDiff < 170) {
            map.setView([lat, lng], map.getZoom());
        }

    } catch (error) {
        console.error("Failed to fetch ISS position:", error);
    }
}

// Fetch and render trail from DynamoDB
async function fetchAndRenderTrail() {
    try {
        const response = await fetch('https://7lqytqrrzl.execute-api.us-east-1.amazonaws.com/prod/trail');
        const data = await response.json();        if (Array.isArray(data) && data.length >= 2) {
            const latlngs = data.map(point => [parseFloat(point.lat), parseFloat(point.lng)]);
            L.polyline(latlngs, {
                color: 'red',
                noClip: false
            }).addTo(map);
        } else {
            console.warn("Trail skipped: need at least 2 points, got:", data.length);
        }

    } catch (error) {
        console.error("Error loading ISS trail:", error);
    }
}

// Function to handle container resize and adjust map
function handleResize() {
    // Get the bounds of the world to create a view that fits our constraints
    const worldBounds = L.latLngBounds([[-90, -180], [90, 180]]);
    
    // Adjust the map to fit these bounds
    map.fitBounds(worldBounds, {
        padding: [10, 10],
        maxZoom: 2,
        animate: false
    });
}

// Call resize handler on load
handleResize();

// Handle window resize events
window.addEventListener('resize', handleResize);

// Load ISS data
updateISS();
fetchAndRenderTrail();

// Set interval to update ISS position
setInterval(updateISS, 10000); // Update every 10 seconds
