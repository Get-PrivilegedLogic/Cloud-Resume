// Initialize NASA-style map
let map = L.map('map', {
    center: [0, 0],
    zoom: 2,
    scrollWheelZoom: true,
    zoomDelta: 0.25,
    zoomSnap: 0.25,
    worldCopyJump: false,
    attributionControl: true,
    fadeAnimation: true,
    zoomAnimation: true,
    minZoom: 1,
    maxZoom: 7,
    maxBounds: [[-90, -190], [90, 190]], // Slightly wider bounds to avoid cut-off
    maxBoundsViscosity: 1.0,
    preferCanvas: true,
    bounceAtZoomLimits: false,
    attributionControl: false
});

// Add NASA-style dark tile layer
const nasaDarkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    noWrap: true,
    bounds: [[-90, -180], [90, 180]]
}).addTo(map);

// Add grid lines for NASA-style look
const addGridLines = () => {
    // Add longitude lines
    for (let i = -180; i <= 180; i += 30) {
        L.polyline([[-90, i], [90, i]], {
            color: 'rgba(50, 100, 200, 0.5)',
            weight: 0.5,
            interactive: false
        }).addTo(map);
    }
    
    // Add latitude lines
    for (let i = -90; i <= 90; i += 30) {
        L.polyline([[i, -180], [i, 180]], {
            color: 'rgba(50, 100, 200, 0.5)',
            weight: 0.5,
            interactive: false
        }).addTo(map);
    }
    
    // Add special equator line
    L.polyline([[0, -180], [0, 180]], {
        color: 'rgba(100, 150, 255, 0.8)',
        weight: 1,
        dashArray: '5, 8',
        interactive: false
    }).addTo(map);
};

// Call the function to add grid lines
addGridLines();

// Add custom attribution with NASA-style look
L.control.attribution({
    position: 'bottomright',
    prefix: 'CloudCrafted.dev ISS Tracker | Data: wheretheiss.at'
}).addTo(map);

// Custom ISS icon with better visibility on dark map
let issIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
    iconSize: [42, 30],
    iconAnchor: [21, 15],
    className: 'iss-icon'
});

// Add ISS marker
let issMarker = L.marker([0, 0], { 
    icon: issIcon,
    zIndexOffset: 1000 // Ensure ISS is always on top
}).addTo(map);

// Add ISS trajectory line placeholder
let trajectoryLine = null;
let orbitCircle = null;

// Generate a predicted orbit path (approximate orbital path based on current position)
function generateOrbitPath(lat, lng, alt) {
    // Clear previous trajectory elements
    if (trajectoryLine) map.removeLayer(trajectoryLine);
    if (orbitCircle) map.removeLayer(orbitCircle);
    
    // Create points for a rough orbital trajectory (simplified approximation)
    const points = [];
    const orbitalInclination = 51.6; // ISS orbital inclination in degrees
    
    // Create future orbit points (simplified prediction)
    for (let i = 0; i <= 360; i += 5) {
        const angle = i * Math.PI / 180;
        const latOffset = Math.sin(angle) * orbitalInclination * 0.75;
        const lngOffset = i * 0.5; // Move eastward
        
        let orbitLat = lat + latOffset;
        let orbitLng = (lng + lngOffset) % 360;
        if (orbitLng > 180) orbitLng -= 360;
        
        // Ensure we stay within valid bounds
        if (orbitLat >= -90 && orbitLat <= 90) {
            points.push([orbitLat, orbitLng]);
        }
    }
    
    // Create trajectory line with custom styling
    trajectoryLine = L.polyline(points, {
        color: '#ffcc00',
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 10',
        className: 'iss-trajectory'
    }).addTo(map);
    
    // Add a subtle orbit circle
    orbitCircle = L.circle([lat, lng], {
        radius: 2000000, // Approximate, based on altitude
        color: '#75b9ff',
        fillColor: 'rgba(0, 102, 255, 0.05)',
        weight: 1,
        fillOpacity: 0.1
    }).addTo(map);
}

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
          // Parse coordinates and other data
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        const altitude = parseFloat(data.altitude);
        const velocity = parseFloat(data.velocity);
        const timestamp = new Date().toLocaleTimeString();
        
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new Error(`Invalid coordinates received: lat=${lat}, lng=${lng}`);
        }
        
        // Update status indicator
        statusIndicator.innerHTML = '✅';
        statusIndicator.title = `Last updated: ${timestamp} - Position: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        
        // Update info header with all position data
        updateInfoHeader(lat, lng, altitude, velocity, timestamp);
        
        // Update marker position
        issMarker.setLatLng([lat, lng]);
        
        // Create popup with detailed position info
        const altitudeMiles = (altitude * 0.621371).toFixed(0);
        const velocityMph = (velocity * 0.621371).toFixed(0);
        
        issMarker.bindPopup(
            `<b>ISS Current Position</b><br>` +
            `Latitude: ${lat.toFixed(2)}°<br>` +
            `Longitude: ${lng.toFixed(2)}°<br>` +
            `Altitude: ${altitudeMiles} miles<br>` +
            `Speed: ${velocityMph} mph<br>` +
            `Updated: ${timestamp}`
        );
        
        // Generate orbit prediction path based on current position
        generateOrbitPath(lat, lng, altitude);
          // For NASA-style static map, always keep ISS in view
        // Ensure we're not exceeding the bounds of our static map
        let adjustedLng = lng;
        if (adjustedLng < -180) adjustedLng = -180;
        if (adjustedLng > 180) adjustedLng = 180;
        
        // Always keep ISS centered in view
        map.setView([lat, adjustedLng], map.getZoom());
          // Log position update
        console.log(`ISS Position Updated: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)} at ${new Date().toLocaleTimeString()}`);
        
        // Add position to trail
        if (!window.trailPositions) {
            window.trailPositions = [];
        }
          // Add new position to the trail
        // For static NASA-style map, ensure trail coordinates are within bounds
        const boundedLng = lng < -180 ? -180 : (lng > 180 ? 180 : lng);
        window.trailPositions.push([lat, boundedLng]);
        
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
            
            // Process trail points to handle date line crossing on static map
            let processedTrail = [];
            let lastPoint = null;
            
            // Process each point to avoid lines crossing the entire map when crossing the date line
            window.trailPositions.forEach(point => {
                if (lastPoint) {
                    // If crossing date line, don't connect the points
                    const lngDiff = Math.abs(lastPoint[1] - point[1]);
                    if (lngDiff > 300) {
                        // Start a new segment
                        processedTrail.push(null); // Null creates a break in the line
                    }
                }
                processedTrail.push(point);
                lastPoint = point;
            });
            
            // Draw the updated trail with date line handling
            L.polyline(processedTrail, {
                color: '#ff4500',
                weight: 3,
                opacity: 0.7,
                dashArray: '5, 10',
                smoothFactor: 1.5
            }).addTo(map);
        }

        // Update information in the header
        updateInfoHeader(lat, lng, new Date().toLocaleTimeString());

    } catch (error) {
        console.error("Failed to fetch ISS position:", error);
        statusIndicator.innerHTML = '❌';
        statusIndicator.title = 'Error updating ISS position. Will retry.';
    }
}

// Update information in the header with all NASA-style data
function updateInfoHeader(lat, lng, altitude, velocity, timestamp) {
    const updateTimeElement = document.getElementById('update-time');
    const latElement = document.getElementById('iss-latitude');
    const lngElement = document.getElementById('iss-longitude');
    const altElement = document.getElementById('iss-altitude');
    const velElement = document.getElementById('iss-velocity');
    
    if (updateTimeElement) {
        updateTimeElement.textContent = timestamp;
    }
    
    if (latElement) {
        latElement.textContent = lat.toFixed(2) + '°';
    }
    
    if (lngElement) {
        lngElement.textContent = lng.toFixed(2) + '°';
    }
    
    if (altElement && altitude !== undefined) {
        // Convert from km to miles
        const altitudeMiles = (altitude * 0.621371).toFixed(0);
        altElement.textContent = altitudeMiles + ' mi';
    }
    
    if (velElement && velocity !== undefined) {
        // Convert from km/h to mph
        const velocityMph = (velocity * 0.621371).toFixed(0);
        velElement.textContent = velocityMph + ' mph';
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
    map.invalidateSize({
        animate: false,
        pan: false,
        debounceMoveend: true
    });
    
    // Calculate available space considering the header
    const navBarHeight = document.querySelector('.nav-bar')?.offsetHeight || 0;
    const infoHeaderHeight = document.querySelector('.info-header')?.offsetHeight || 0;
    const totalHeaderHeight = navBarHeight + infoHeaderHeight;
    
    // Calculate viewport dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate available map height
    const availableHeight = windowHeight - totalHeaderHeight;
      // Ensure the map container fills the available space
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.width = '100vw'; // Use viewport width for consistency
        mapContainer.style.height = availableHeight + 'px';
        mapContainer.style.left = '0'; // Ensure alignment with left edge
        mapContainer.style.right = '0'; // Ensure alignment with right edge
    }
      // Set proper zoom level based on container size for NASA-style view
    let optimalZoom;
    if (windowWidth < 500) {
        optimalZoom = 1; // Mobile view
    } else if (windowWidth < 1000) {
        optimalZoom = 2; // Medium screen
    } else {
        optimalZoom = 2.5; // Large screen - closer view like NASA trackers
    }
    
    // Apply zoom and center if we have a current ISS position
    const currentPosition = issMarker.getLatLng();
    if (currentPosition && currentPosition.lat !== 0 && currentPosition.lng !== 0) {
        // For NASA-like view, we may need to adjust longitude to keep in bounds
        let lng = currentPosition.lng;
        if (lng < -180) lng = -180;
        if (lng > 180) lng = 180;
        
        map.setView([currentPosition.lat, lng], optimalZoom);
    } else {
        map.setView([0, 0], optimalZoom);
    }
    
    // Set a strict max/min zoom to prevent over-zooming
    map.setMinZoom(1);
    map.setMaxZoom(8);
    
    // Log resize for debugging
    console.log(`Map resized: ${windowWidth}x${availableHeight}, zoom: ${optimalZoom}`);
}

// Initialize the map properly on page load
window.addEventListener('DOMContentLoaded', function() {
    // Call resize handler immediately to set initial view
    setTimeout(handleResize, 100);
    
    // Add another resize call after images and resources load
    window.addEventListener('load', function() {
        // Force map to recalculate and redraw completely
        map.invalidateSize({animate: false, pan: false, debounceMoveend: true});
        setTimeout(handleResize, 200);
        
        // Call resize multiple times to ensure proper rendering as resources load
        setTimeout(function() {
            map.invalidateSize({animate: false, pan: false, debounceMoveend: true});
            handleResize();
            // Force full redraw of tiles
            map.eachLayer(function(layer) {
                if (layer instanceof L.TileLayer) {
                    layer.redraw();
                }
            });
        }, 1000);
        
        // Final resize check after everything should be loaded
        setTimeout(function() {
            map.invalidateSize({animate: false, pan: false, debounceMoveend: true});
            handleResize();
        }, 2000);
    });
});

// Handle window resize events with debounce for better performance
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 250);
    
    // Force additional resize after orientation changes (especially for mobile)
    if (window.orientation !== undefined) {
        setTimeout(handleResize, 500);
    }
});

// Wait for full page load to initialize data
window.addEventListener('load', function() {
    // Initialize trail positions array
    window.trailPositions = [];
    
    // Force map to recalculate size on Leaflet load
    if (L && L.version) {
        console.log('Leaflet detected, version:', L.version);
        map.invalidateSize({animate: false, pan: false});
    }
    
    // Short delay to ensure Leaflet is fully initialized
    setTimeout(() => {
        try {
            // Force another size recalculation
            map.invalidateSize({animate: false, pan: false});
            
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
