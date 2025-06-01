// Initialize map and fit to container width
let map = L.map('map', {
    center: [0, 0],
    zoom: 2,
    scrollWheelZoom: false,
    zoomDelta: 0.25,
    zoomSnap: 0.25,
    worldCopyJump: true,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0,
    attributionControl: true,
    fadeAnimation: true,
    zoomAnimation: true
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
    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.innerHTML = '⏳';
    statusIndicator.title = 'Updating ISS position...';
    
    try {
        // Use a fallback API if the primary one fails
        let apiUrls = [
            'https://7lqytqrrzl.execute-api.us-east-1.amazonaws.com/prod/position',
            'https://api.wheretheiss.at/v1/satellites/25544'
        ];
        
        let response, data, lat, lng;
        let success = false;
        
        // Try each API in order
        for (const url of apiUrls) {
            try {
                response = await fetch(url);
                
                if (!response.ok) {
                    console.warn(`API endpoint ${url} returned status: ${response.status}`);
                    continue;
                }
                
                data = await response.json();
                
                // Handle different API response formats
                if (url.includes('wheretheiss.at')) {
                    lat = parseFloat(data.latitude);
                    lng = parseFloat(data.longitude);
                } else {
                    lat = parseFloat(data.latitude);
                    lng = parseFloat(data.longitude);
                }
                
                // Validate coordinates
                if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    console.warn(`Invalid coordinates received: lat=${lat}, lng=${lng}`);
                    continue;
                }
                
                success = true;
                break;
            } catch (apiError) {
                console.warn(`Error with API ${url}:`, apiError);
            }
        }
        
        if (!success) {
            throw new Error("All APIs failed to return valid position data");
        }
        
        // Update indicator with coordinates
        statusIndicator.innerHTML = '✅';
        statusIndicator.title = `Last updated: ${new Date().toLocaleTimeString()} - Position: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        
        // Update marker position
        issMarker.setLatLng([lat, lng]);
        
        // Create popup with position info
        issMarker.bindPopup(`<b>ISS Current Position</b><br>Latitude: ${lat.toFixed(4)}°<br>Longitude: ${lng.toFixed(4)}°<br>Updated: ${new Date().toLocaleTimeString()}`);
        
        // Handle date line crossing by checking current center and new position
        const currentCenter = map.getCenter();
        const lngDiff = Math.abs(currentCenter.lng - lng);
        
        // Only adjust view if we're not crossing the date line or user has manually panned
        if (lngDiff < 170) {
            map.setView([lat, lng], map.getZoom());
        }
        
        // Log position update
        console.log(`ISS Position Updated: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)} at ${new Date().toLocaleTimeString()}`);

    } catch (error) {
        console.error("Failed to fetch ISS position:", error);
        statusIndicator.innerHTML = '❌';
        statusIndicator.title = 'Error updating ISS position. Will retry.';
    }
}

// Fetch and render trail from DynamoDB
async function fetchAndRenderTrail() {
    const statusIndicator = document.getElementById('status-indicator');
    
    try {
        const response = await fetch('https://7lqytqrrzl.execute-api.us-east-1.amazonaws.com/prod/trail');
        
        if (!response.ok) {
            console.warn(`Trail API returned status: ${response.status}`);
            return;
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            console.warn("Trail API did not return an array:", data);
            return;
        }
        
        // Filter out any invalid coordinates
        const validPoints = data.filter(point => {
            const lat = parseFloat(point.lat);
            const lng = parseFloat(point.lng);
            return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        });
        
        if (validPoints.length >= 2) {
            const latlngs = validPoints.map(point => [parseFloat(point.lat), parseFloat(point.lng)]);
            try {
                L.polyline(latlngs, {
                    color: 'red',
                    weight: 2,
                    opacity: 0.7,
                    noClip: false
                }).addTo(map);
                console.log(`Trail rendered with ${validPoints.length} points`);
            } catch (renderError) {
                console.error("Error rendering trail:", renderError);
            }
        } else {
            console.warn(`Trail skipped: need at least 2 valid points, got: ${validPoints.length}`);
        }

    } catch (error) {
        console.error("Error loading ISS trail:", error);
    }
}

// Function to handle container resize and adjust map
function handleResize() {
    // Force map invalidation to recalculate size
    map.invalidateSize();
    
    // Get the bounds of the world
    const southWest = L.latLng(-85, -180);
    const northEast = L.latLng(85, 180);
    const worldBounds = L.latLngBounds(southWest, northEast);
    
    // Set a strict max/min zoom to prevent over-zooming
    map.setMinZoom(1);
    map.setMaxZoom(8);
    
    // Adjust the map to fit the world bounds
    map.fitBounds(worldBounds, {
        padding: [5, 5],
        maxZoom: 2,
        animate: false
    });
}

// Call resize handler after a short delay to ensure DOM is fully loaded
setTimeout(handleResize, 300);

// Handle window resize events
window.addEventListener('resize', function() {
    setTimeout(handleResize, 100);
});

// Load ISS data when page and all resources are fully loaded
window.addEventListener('load', function() {
    // Short delay to ensure Leaflet is fully initialized
    setTimeout(() => {
        // Initial update
        updateISS();
        fetchAndRenderTrail();
        
        // Set interval to update ISS position every minute (60000 ms)
        setInterval(updateISS, 60000);
        
        // Log to console for verification
        console.log('ISS Tracker initialized - updates every minute');
    }, 500);
});
