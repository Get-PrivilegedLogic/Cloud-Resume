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
        // Use a reliable public API as the primary source
        const apiUrl = 'https://api.wheretheiss.at/v1/satellites/25544';
        
        console.log('Fetching ISS position from:', apiUrl);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Parse coordinates
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new Error(`Invalid coordinates received: lat=${lat}, lng=${lng}`);
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
        
        // Add position to trail
        if (!window.trailPositions) {
            window.trailPositions = [];
        }
        
        // Add new position to the trail
        window.trailPositions.push([lat, lng]);
        
        // Limit trail length to prevent performance issues
        if (window.trailPositions.length > 100) {
            window.trailPositions.shift(); // Remove oldest position
        }
        
        // Update the trail visualization if we have enough points
        if (window.trailPositions.length >= 2) {
            // Clear any existing polylines
            map.eachLayer(function(layer) {
                if (layer instanceof L.Polyline && !(layer instanceof L.Rectangle)) {
                    map.removeLayer(layer);
                }
            });
            
            // Draw the updated trail
            L.polyline(window.trailPositions, {
                color: '#ff4500',
                weight: 3,
                opacity: 0.7,
                dashArray: '5, 10',
                smoothFactor: 1.5
            }).addTo(map);
        }

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
        // Instead of using the problematic API, let's generate our own trail
        // by tracking ISS positions over time
        console.log('Creating simulated ISS trail');
        
        // Initialize trail data if it doesn't exist yet
        if (!window.trailPositions) {
            window.trailPositions = [];
        }
        
        // Try to get current ISS position to start the trail
        try {
            const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
            if (response.ok) {
                const data = await response.json();
                const lat = parseFloat(data.latitude);
                const lng = parseFloat(data.longitude);
                
                // Add position to trail if valid
                if (!isNaN(lat) && !isNaN(lng)) {
                    window.trailPositions.push([lat, lng]);
                    console.log(`Added position to trail: [${lat.toFixed(2)}, ${lng.toFixed(2)}]`);
                }
            }
        } catch (err) {
            console.warn('Could not fetch initial position for trail:', err);
        }
          // Clear any existing polylines
        map.eachLayer(function(layer) {
            if (layer instanceof L.Polyline && !(layer instanceof L.Rectangle)) {
                map.removeLayer(layer);
            }
        });
        
        // If we have enough points, draw the trail
        if (window.trailPositions && window.trailPositions.length >= 2) {
            try {
                // Create a copy of the positions to avoid mutation issues
                const positions = [...window.trailPositions];
                
                L.polyline(positions, {
                    color: '#ff4500',
                    weight: 3,
                    opacity: 0.7,
                    dashArray: '5, 10',
                    smoothFactor: 1.5
                }).addTo(map);
                
                console.log(`Trail rendered with ${positions.length} points`);
            } catch (renderError) {
                console.error("Error rendering trail:", renderError);
            }
        } else {
            console.log("Not enough points for trail yet, waiting for more positions...");
        }

    } catch (error) {
        console.error("Error loading ISS trail:", error);
    }
}

// Function to handle container resize and adjust map
function handleResize() {
    // Force map invalidation to recalculate size
    map.invalidateSize();
    
    // Calculate optimal view
    const containerWidth = document.getElementById('map').offsetWidth;
    const containerHeight = document.getElementById('map').offsetHeight;
    
    // Set proper zoom level based on container size
    let optimalZoom;
    if (containerWidth < 500) {
        optimalZoom = 1; // Mobile view
    } else if (containerWidth < 1000) {
        optimalZoom = 1.5; // Medium screen
    } else {
        optimalZoom = 2; // Large screen
    }
    
    // Apply zoom and center
    map.setView([0, 0], optimalZoom);
    
    // Set a strict max/min zoom to prevent over-zooming
    map.setMinZoom(1);
    map.setMaxZoom(8);
}

// Initialize the map properly on page load
window.addEventListener('DOMContentLoaded', function() {
    // Call resize handler immediately to set initial view
    setTimeout(handleResize, 100);
    
    // Add another resize call after images and resources load
    window.addEventListener('load', function() {
        setTimeout(handleResize, 200);
    });
});

// Handle window resize events with debounce for better performance
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 250);
});

// Wait for full page load to initialize data
window.addEventListener('load', function() {
    // Initialize trail positions array
    window.trailPositions = [];
    
    // Short delay to ensure Leaflet is fully initialized
    setTimeout(() => {
        try {
            // Initial update
            updateISS();
            
            // Set interval to update ISS position every 30 seconds (30000 ms)
            // This gives us more frequent position updates for a better trail
            const updateInterval = setInterval(updateISS, 30000);
            
            // Set up trail updates (less frequent than position updates)
            setTimeout(fetchAndRenderTrail, 5000);
            const trailInterval = setInterval(fetchAndRenderTrail, 120000);
            
            // Log to console for verification
            console.log('ISS Tracker initialized - position updates every 30 seconds, trail updates every 2 minutes');
        } catch (initError) {
            console.error('Error during initialization:', initError);
            document.getElementById('status-indicator').innerHTML = '⚠️';
            document.getElementById('status-indicator').title = 'Initialization error. Please refresh the page.';
        }
    }, 1000); // Longer timeout to ensure everything is ready
});
