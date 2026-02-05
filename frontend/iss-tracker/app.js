// ISS Tracker - Static map version

// Global variables
let orbitPathPoints = [];
const maxOrbitPoints = 100;
let crewData = null;

// ================================================
// CREW PANEL FUNCTIONALITY
// ================================================

// Fetch crew data with HTTPS fallback chain
async function fetchCrewData() {
    // HTTPS-compatible APIs (primary and fallback)
    const apiEndpoints = [
        {
            url: 'https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json',
            transform: (data) => ({
                message: 'success',
                number: data.number,
                people: data.people.map(p => ({
                    name: p.name,
                    craft: p.spacecraft || p.craft || 'ISS',
                    country: p.country || null,
                    flagCode: p.flag_code || null,
                    agency: p.agency || null,
                    position: p.position || null,
                    launchedTimestamp: p.launched || null,
                    daysInSpace: p.days_in_space || null,
                    image: p.image || null,
                    bioUrl: p.url || null,
                    twitter: p.twitter || null,
                    instagram: p.instagram || null,
                    isIss: p.iss !== undefined ? p.iss : true
                }))
            })
        },
        {
            url: 'http://api.open-notify.org/astros.json',
            transform: (data) => ({
                message: 'success',
                number: data.number,
                people: data.people.map(p => ({
                    name: p.name,
                    craft: p.craft || 'ISS',
                    country: null,
                    flagCode: null,
                    agency: null,
                    position: null,
                    launchedTimestamp: null,
                    daysInSpace: null,
                    image: null,
                    bioUrl: null,
                    twitter: null,
                    instagram: null,
                    isIss: p.craft === 'ISS'
                }))
            })
        }
    ];

    let lastError = null;

    for (const endpoint of apiEndpoints) {
        try {
            const response = await fetch(endpoint.url);

            if (!response.ok) {
                throw new Error(`API returned status: ${response.status}`);
            }

            const rawData = await response.json();
            const data = endpoint.transform(rawData);

            if (data.message !== 'success' && !data.people) {
                throw new Error('API returned unsuccessful response');
            }

            crewData = data;
            return data;
        } catch (error) {
            console.warn(`Failed to fetch from ${endpoint.url}:`, error.message);
            lastError = error;
            continue;
        }
    }

    console.error('All crew data APIs failed:', lastError);
    throw lastError;
}

// Render crew members in the panel
function renderCrewList(data) {
    const crewList = document.getElementById('crew-list');
    const crewCount = document.querySelector('.crew-count');
    const crewUpdated = document.getElementById('crew-updated');

    if (!crewList) return;

    // Filter for ISS crew only
    const issCrew = data.people.filter(person => person.isIss || person.craft === 'ISS');
    const otherCrew = data.people.filter(person => !person.isIss && person.craft !== 'ISS');

    // Update crew count badge
    if (crewCount) {
        crewCount.textContent = issCrew.length;
    }

    // Update timestamp
    if (crewUpdated) {
        crewUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }

    // Build crew list HTML
    let html = '';

    // ISS Crew section
    if (issCrew.length > 0) {
        issCrew.forEach(person => {
            html += createCrewMemberCard(person);
        });
    }

    // Other spacecraft section (if any)
    if (otherCrew.length > 0) {
        html += `<div class="crew-section-divider">Other Spacecraft</div>`;
        otherCrew.forEach(person => {
            html += createCrewMemberCard(person);
        });
    }

    crewList.innerHTML = html;
}

// Convert country code to flag emoji
function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

// Format days in space
function formatDaysInSpace(days) {
    if (!days) return null;
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    const years = Math.floor(days / 365);
    const remainingMonths = Math.floor((days % 365) / 30);
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}m`;
}

// Format launch date
function formatLaunchDate(timestamp) {
    if (!timestamp) return null;
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Create HTML for a single crew member card
function createCrewMemberCard(person) {
    // Determine icon based on craft
    const craftIcon = person.craft === 'ISS' ? 'fa-satellite' : 'fa-rocket';

    // Build avatar - use image if available
    const avatarHtml = person.image
        ? `<img src="${escapeHtml(person.image)}" alt="${escapeHtml(person.name)}" class="crew-avatar-img" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user-astronaut\\'></i>'">`
        : `<i class="fas fa-user-astronaut"></i>`;

    // Build country/flag display
    const flagEmoji = getFlagEmoji(person.flagCode);
    const countryDisplay = person.country
        ? `<span class="crew-country">${flagEmoji} ${escapeHtml(person.country)}</span>`
        : '';

    // Build position/role display
    const positionDisplay = person.position
        ? `<div class="crew-position">${escapeHtml(person.position)}</div>`
        : '';

    // Build agency badge
    const agencyDisplay = person.agency
        ? `<span class="crew-agency">${escapeHtml(person.agency)}</span>`
        : '';

    // Build time in space stat
    const daysDisplay = formatDaysInSpace(person.daysInSpace);
    const timeInSpaceHtml = daysDisplay
        ? `<div class="crew-stat"><i class="fas fa-clock"></i> ${daysDisplay} in space</div>`
        : '';

    // Build launch date stat
    const launchDate = formatLaunchDate(person.launchedTimestamp);
    const launchHtml = launchDate
        ? `<div class="crew-stat"><i class="fas fa-rocket"></i> Launched ${launchDate}</div>`
        : '';

    // Build social links
    let socialHtml = '';
    if (person.twitter || person.instagram || person.bioUrl) {
        socialHtml = '<div class="crew-social">';
        if (person.twitter) {
            socialHtml += `<a href="https://twitter.com/${escapeHtml(person.twitter)}" target="_blank" rel="noopener" title="Twitter"><i class="fab fa-twitter"></i></a>`;
        }
        if (person.instagram) {
            socialHtml += `<a href="https://instagram.com/${escapeHtml(person.instagram)}" target="_blank" rel="noopener" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        }
        if (person.bioUrl) {
            socialHtml += `<a href="${escapeHtml(person.bioUrl)}" target="_blank" rel="noopener" title="Biography"><i class="fas fa-external-link-alt"></i></a>`;
        }
        socialHtml += '</div>';
    }

    return `
        <div class="crew-member">
            <div class="crew-member-header">
                <div class="crew-avatar">
                    ${avatarHtml}
                </div>
                <div class="crew-member-info">
                    <h3 class="crew-name">${escapeHtml(person.name)}</h3>
                    ${positionDisplay}
                    <div class="crew-meta">
                        ${countryDisplay}
                        ${agencyDisplay}
                    </div>
                </div>
            </div>
            <div class="crew-details">
                ${timeInSpaceHtml}
                ${launchHtml}
            </div>
            ${socialHtml}
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error state in crew panel
function showCrewError(message) {
    const crewList = document.getElementById('crew-list');
    if (!crewList) return;

    crewList.innerHTML = `
        <div class="crew-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${escapeHtml(message)}</p>
            <button onclick="initCrewPanel()" class="retry-btn" style="
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: #0a3872;
                border: 1px solid #1e5799;
                color: #7fb1ff;
                border-radius: 4px;
                cursor: pointer;
            ">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
}

// Toggle crew panel open/closed
function toggleCrewPanel() {
    const panel = document.getElementById('crew-panel');
    if (panel) {
        panel.classList.toggle('open');
    }
}

// Initialize crew panel
async function initCrewPanel() {
    const crewList = document.getElementById('crew-list');
    if (crewList) {
        crewList.innerHTML = `
            <div class="crew-loading">
                <i class="fas fa-spinner fa-spin"></i> Loading crew data...
            </div>
        `;
    }

    try {
        const data = await fetchCrewData();
        renderCrewList(data);
    } catch (error) {
        showCrewError('Unable to load crew data. Please try again.');
    }
}

// Set up crew panel event listeners
function setupCrewPanelEvents() {
    const toggleBtn = document.getElementById('crew-toggle');
    const closeBtn = document.getElementById('crew-close');
    const panel = document.getElementById('crew-panel');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleCrewPanel);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', toggleCrewPanel);
    }

    // Close panel when clicking outside (optional)
    document.addEventListener('click', (e) => {
        if (panel && panel.classList.contains('open')) {
            if (!panel.contains(e.target) && !toggleBtn.contains(e.target)) {
                panel.classList.remove('open');
            }
        }
    });

    // Close panel with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel && panel.classList.contains('open')) {
            panel.classList.remove('open');
        }
    });
}

// Add pulsing effect to ISS icon
function addPulsingEffect() {
    const issIcon = document.getElementById('iss-icon');
    if (!issIcon) return;
    
    // Add pulsing animation with CSS
    issIcon.style.animation = 'pulse 2s infinite';
    
    // Add keyframes if they don't exist
    if (!document.getElementById('pulse-keyframes')) {
        const style = document.createElement('style');
        style.id = 'pulse-keyframes';
        style.textContent = `
            @keyframes pulse {
                0% { filter: drop-shadow(0 0 5px rgba(255, 255, 0, 0.8)) brightness(1.2); transform: translate(-50%, -50%) scale(1); }
                50% { filter: drop-shadow(0 0 15px rgba(255, 255, 0, 1)) brightness(1.5); transform: translate(-50%, -50%) scale(1.15); }
                100% { filter: drop-shadow(0 0 5px rgba(255, 255, 0, 0.8)) brightness(1.2); transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Convert latitude/longitude to x/y position on the map
function latLngToPosition(lat, lng) {
    // Map lat (-90 to 90) to y (100% to 0%)
    const y = (90 - lat) / 180;
    
    // Map lng (-180 to 180) to x (0% to 100%)
    let x = (lng + 180) / 360;
    
    return {
        x: x * 100, // convert to percentage
        y: y * 100  // convert to percentage
    };
}

// Update the ISS icon position with smooth animation
function updateISSPosition(lat, lng) {
    const position = latLngToPosition(lat, lng);
    const issIcon = document.getElementById('iss-icon');
    
    if (issIcon) {
        // Use CSS transitions for smooth movement
        issIcon.style.left = `${position.x}%`;
        issIcon.style.top = `${position.y}%`;
    }
}

// Draw the orbit path based on accumulated positions
function updateOrbitPath() {
    // Log the number of points for debugging
    console.log(`Updating orbit path with ${orbitPathPoints.length} points`);
    
    if (orbitPathPoints.length < 2) {
        console.log("Not enough points to draw path");
        return;
    }
    
    const orbitPath = document.querySelector('.orbit-path');
    if (!orbitPath) {
        console.error("Orbit path container not found");
        return;
    }
    
    // Create SVG element
    let svg = orbitPath.querySelector('svg');
    if (!svg) {
        console.log("Creating new SVG element for orbit path");
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        orbitPath.appendChild(svg);
    }
    
    // Create path element with much higher visibility
    let path = svg.querySelector('path:not(.prediction)');
    if (!path) {
        console.log("Creating new path element for orbit trail");
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#ff9500'); // Brighter orange color
        path.setAttribute('stroke-width', '4');  // Thicker line
        path.setAttribute('stroke-dasharray', '7, 5');
        path.setAttribute('opacity', '1');  // Full opacity
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('filter', 'drop-shadow(0 0 3px #ff9500)'); // Add glow
        svg.appendChild(path);
    } else {
        // Update existing path attributes to make sure it's very visible
        path.setAttribute('stroke', '#ff9500');
        path.setAttribute('stroke-width', '4');
        path.setAttribute('opacity', '1');
        path.setAttribute('filter', 'drop-shadow(0 0 3px #ff9500)');
    }
    
    // Create path data from points
    let pathData = '';
    let skipNext = false;
    
    orbitPathPoints.forEach((point, index) => {
        const pos = latLngToPosition(point.lat, point.lng);
        
        // Check for international date line crossing
        if (index > 0) {
            const prevPos = latLngToPosition(orbitPathPoints[index-1].lat, orbitPathPoints[index-1].lng);
            // If x position difference is too large, it's crossing the date line
            if (Math.abs(pos.x - prevPos.x) > 50) {
                skipNext = true;
                return;
            }
        }
        
        if (skipNext) {
            skipNext = false;
            pathData += `M ${pos.x} ${pos.y}`;
        } else if (index === 0) {
            pathData += `M ${pos.x} ${pos.y}`;
        } else {
            pathData += ` L ${pos.x} ${pos.y}`;
        }
    });
    
    // Set the path data and log for debugging
    path.setAttribute('d', pathData);
    console.log(`Path data set with ${orbitPathPoints.length} points`);
}

// Generate orbit prediction
function generateOrbitPrediction(lat, lng) {
    console.log(`Generating orbit prediction from lat: ${lat}, lng: ${lng}`);
    
    const orbitPoints = [];
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
            orbitPoints.push({lat: orbitLat, lng: orbitLng});
        }
    }
    
    console.log(`Created ${orbitPoints.length} prediction points`);
    
    // Draw orbit prediction line
    const orbitPath = document.querySelector('.orbit-path');
    if (!orbitPath) {
        console.error("Orbit path container not found for prediction");
        return;
    }
    
    // Create SVG for orbit prediction
    let svg = orbitPath.querySelector('svg');
    if (!svg) {
        console.log("Creating new SVG element for prediction path");
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        orbitPath.appendChild(svg);
    }
    
    // Create path for prediction with enhanced visibility
    let path = svg.querySelector('path.prediction');
    if (!path) {
        console.log("Creating new path element for prediction");
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'prediction');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#ffdd00'); // Bright yellow
        path.setAttribute('stroke-width', '2.5');
        path.setAttribute('stroke-dasharray', '3, 5');
        path.setAttribute('opacity', '0.8'); // More visible
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('filter', 'drop-shadow(0 0 2px #ffdd00)'); // Add glow
        svg.appendChild(path);
    } else {
        // Update existing path attributes for better visibility
        path.setAttribute('stroke', '#ffdd00');
        path.setAttribute('stroke-width', '2.5');
        path.setAttribute('opacity', '0.8');
        path.setAttribute('filter', 'drop-shadow(0 0 2px #ffdd00)');
    }
    
    // Create path data
    let pathData = '';
    let skipNext = false;
    
    orbitPoints.forEach((point, index) => {
        const pos = latLngToPosition(point.lat, point.lng);
        
        // Check for international date line crossing
        if (index > 0) {
            const prevPos = latLngToPosition(orbitPoints[index-1].lat, orbitPoints[index-1].lng);
            if (Math.abs(pos.x - prevPos.x) > 50) {
                skipNext = true;
                return;
            }
        }
        
        if (skipNext) {
            skipNext = false;
            pathData += `M ${pos.x} ${pos.y}`;
        } else if (index === 0) {
            pathData += `M ${pos.x} ${pos.y}`;
        } else {
            pathData += ` L ${pos.x} ${pos.y}`;
        }
    });
    
    // Set the path data and log for debugging
    path.setAttribute('d', pathData);
    console.log("Prediction path data set");
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

// Update ISS position
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
        
        // Update info header with position data
        updateInfoHeader(lat, lng, altitude, velocity, timestamp);
        
        // Update ISS position on the static map
        updateISSPosition(lat, lng);
          // Add the current position to our orbit path points
        orbitPathPoints.push({lat, lng});
        console.log(`Added point to orbit path: [${lat}, ${lng}], total points: ${orbitPathPoints.length}`);
        
        // Keep only the last maxOrbitPoints points
        if (orbitPathPoints.length > maxOrbitPoints) {
            orbitPathPoints.shift(); // Remove oldest point
        }
        
        // After the first position, also add a few points around it to make trail visible immediately
        if (orbitPathPoints.length === 1) {
            console.log("First position - adding additional points to make trail visible");
            // Add a few points slightly offset to make a visible trail
            orbitPathPoints.push({lat: lat + 0.1, lng: lng + 0.1});
            orbitPathPoints.push({lat: lat + 0.2, lng: lng + 0.2});
        }
        
        // Update the orbit path visualization
        updateOrbitPath();
        
        // Generate orbit prediction
        generateOrbitPrediction(lat, lng);
        
        console.log(`ISS Position Updated: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)} at ${timestamp}`);
    } catch (error) {
        console.error("Failed to fetch ISS position:", error);
        statusIndicator.innerHTML = '❌';
        statusIndicator.title = 'Error updating ISS position. Will retry.';
    }
}

// Function to handle container resize
function handleResize() {
    // Calculate available space considering the header
    const navBarHeight = document.querySelector('.nav-bar')?.offsetHeight || 0;
    const infoHeaderHeight = document.querySelector('.info-header')?.offsetHeight || 0;
    const totalHeaderHeight = navBarHeight + infoHeaderHeight;
    
    // Calculate viewport dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate available map height
    const availableHeight = windowHeight - totalHeaderHeight;
    
    // Set the map container height
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        mapContainer.style.height = `${availableHeight}px`;
    }
    
    // Log resize for debugging
    console.log(`Map container resized: ${windowWidth}x${availableHeight}`);
}

// Wait for DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Handle initial size setup
    handleResize();

    // Add pulsing effect to the ISS icon
    addPulsingEffect();

    // Initialize ISS tracking
    updateISS();

    // Set interval to update ISS position every 10 seconds
    setInterval(updateISS, 10000);

    // Add window resize event listener
    window.addEventListener('resize', handleResize);

    // Initialize crew panel
    setupCrewPanelEvents();
    initCrewPanel();

    // Refresh crew data every 5 minutes (crew changes are rare)
    setInterval(initCrewPanel, 300000);
});
