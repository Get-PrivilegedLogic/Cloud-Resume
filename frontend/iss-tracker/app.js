// ISS Tracker - Leaflet Map Version

// ================================================
// GLOBAL VARIABLES
// ================================================

let map = null;
let issMarker = null;
let orbitPath = null;
let orbitPathPoints = [];
const maxOrbitPoints = 100;
let terminator = null;
let crewData = null;
let liveFeedLoaded = false;
let currentLocation = null;

// Custom ISS Icon
const issIcon = L.divIcon({
    className: 'iss-marker',
    html: `<div class="iss-marker-inner">
        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg" alt="ISS" />
    </div>`,
    iconSize: [50, 50],
    iconAnchor: [25, 25]
});

// ================================================
// MAP INITIALIZATION
// ================================================

function initMap() {
    // Create map centered on 0,0 with world view
    map = L.map('map-container', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 8,
        worldCopyJump: true,
        zoomControl: true
    });

    // Add satellite imagery layer (ESRI)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18
    }).addTo(map);

    // Add a semi-transparent overlay for better contrast
    L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 18,
        opacity: 0.4
    }).addTo(map);

    // Initialize day/night terminator
    terminator = L.terminator({
        fillColor: '#000020',
        fillOpacity: 0.4,
        color: '#ffc864',
        weight: 1
    }).addTo(map);

    // Update terminator every minute
    setInterval(() => {
        terminator.setTime();
    }, 60000);

    // Initialize orbit path polyline
    orbitPath = L.polyline([], {
        color: '#ff9500',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 6',
        className: 'orbit-path-line'
    }).addTo(map);

    // Add map click handler to show coordinates
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        L.popup()
            .setLatLng(e.latlng)
            .setContent(`<strong>Coordinates</strong><br>Lat: ${lat.toFixed(4)}°<br>Lng: ${lng.toFixed(4)}°`)
            .openOn(map);
    });
}

// ================================================
// ISS TRACKING
// ================================================

async function updateISS() {
    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.innerHTML = '⏳';
    statusIndicator.title = 'Updating ISS position...';

    try {
        const apiUrl = 'https://api.wheretheiss.at/v1/satellites/25544';
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
        }

        const data = await response.json();

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
        statusIndicator.title = `Last updated: ${timestamp}`;

        // Update info header
        updateInfoHeader(lat, lng, altitude, velocity, timestamp);

        // Update ISS marker position
        updateISSMarker(lat, lng);

        // Update orbit path
        updateOrbitPath(lat, lng);

        // Get and display current location
        fetchCurrentLocation(lat, lng);

    } catch (error) {
        console.error("Failed to fetch ISS position:", error);
        statusIndicator.innerHTML = '❌';
        statusIndicator.title = 'Error updating ISS position. Will retry.';
    }
}

function updateISSMarker(lat, lng) {
    if (!issMarker) {
        issMarker = L.marker([lat, lng], {
            icon: issIcon,
            zIndexOffset: 1000
        }).addTo(map);

        // Add popup to ISS marker
        issMarker.bindPopup(() => {
            const locText = currentLocation ? `<br><strong>Over:</strong> ${currentLocation}` : '';
            return `<strong>International Space Station</strong>${locText}<br><em>Click to follow</em>`;
        });

        issMarker.on('click', () => {
            map.setView([lat, lng], map.getZoom(), { animate: true });
        });
    } else {
        issMarker.setLatLng([lat, lng]);
    }
}

function updateOrbitPath(lat, lng) {
    // Add new point
    orbitPathPoints.push([lat, lng]);

    // Keep only last maxOrbitPoints
    if (orbitPathPoints.length > maxOrbitPoints) {
        orbitPathPoints.shift();
    }

    // Handle international date line crossing
    const segments = [];
    let currentSegment = [];

    for (let i = 0; i < orbitPathPoints.length; i++) {
        const point = orbitPathPoints[i];

        if (i > 0) {
            const prevPoint = orbitPathPoints[i - 1];
            const lngDiff = Math.abs(point[1] - prevPoint[1]);

            // If longitude jump is > 180, we crossed the date line
            if (lngDiff > 180) {
                if (currentSegment.length > 0) {
                    segments.push(currentSegment);
                }
                currentSegment = [point];
                continue;
            }
        }

        currentSegment.push(point);
    }

    if (currentSegment.length > 0) {
        segments.push(currentSegment);
    }

    // Update polyline with segments (use first segment for main line)
    if (segments.length > 0) {
        orbitPath.setLatLngs(segments);
    }
}

// ================================================
// LOCATION DISPLAY
// ================================================

async function fetchCurrentLocation(lat, lng) {
    try {
        // Use reverse geocoding to get location name
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=5&accept-language=en`,
            { headers: { 'User-Agent': 'ISS-Tracker-CloudCrafted' } }
        );

        if (response.ok) {
            const data = await response.json();

            if (data.address) {
                // Build location string
                const parts = [];
                if (data.address.country) {
                    parts.push(data.address.country);
                } else if (data.address.ocean) {
                    parts.push(data.address.ocean);
                } else if (data.address.sea) {
                    parts.push(data.address.sea);
                }

                currentLocation = parts.length > 0 ? parts.join(', ') : 'International Waters';
            } else {
                currentLocation = getOceanFromCoordinates(lat, lng);
            }
        } else {
            currentLocation = getOceanFromCoordinates(lat, lng);
        }

        updateLocationDisplay();
    } catch (error) {
        currentLocation = getOceanFromCoordinates(lat, lng);
        updateLocationDisplay();
    }
}

// Fallback ocean detection based on coordinates
function getOceanFromCoordinates(lat, lng) {
    if (lng > -30 && lng < 70 && lat > -40 && lat < 70) {
        if (lat < 0) return 'South Atlantic Ocean';
        return 'North Atlantic Ocean';
    }
    if (lng >= 70 && lng <= 180 || lng >= -180 && lng < -100) {
        if (lat < 0) return 'South Pacific Ocean';
        return 'North Pacific Ocean';
    }
    if (lng >= 20 && lng <= 150 && lat < 30 && lat > -60) {
        return 'Indian Ocean';
    }
    if (lat < -60) return 'Southern Ocean';
    if (lat > 66) return 'Arctic Ocean';
    return 'Over Ocean';
}

function updateLocationDisplay() {
    let locationEl = document.getElementById('iss-location');
    if (!locationEl) {
        // Create location display if it doesn't exist
        const orbitalData = document.querySelector('.orbital-data');
        if (orbitalData) {
            const locationGroup = document.createElement('div');
            locationGroup.className = 'data-group location-group';
            locationGroup.innerHTML = `
                <div class="data-label">Location</div>
                <div id="iss-location" class="data-value location-value">--</div>
            `;
            orbitalData.appendChild(locationGroup);
            locationEl = document.getElementById('iss-location');
        }
    }

    if (locationEl && currentLocation) {
        locationEl.textContent = currentLocation;
        locationEl.title = currentLocation;
    }
}

// ================================================
// INFO HEADER
// ================================================

function updateInfoHeader(lat, lng, altitude, velocity, timestamp) {
    const updateTimeElement = document.getElementById('update-time');
    const latElement = document.getElementById('iss-latitude');
    const lngElement = document.getElementById('iss-longitude');
    const altElement = document.getElementById('iss-altitude');
    const velElement = document.getElementById('iss-velocity');

    if (updateTimeElement) updateTimeElement.textContent = timestamp;
    if (latElement) latElement.textContent = lat.toFixed(2) + '°';
    if (lngElement) lngElement.textContent = lng.toFixed(2) + '°';

    if (altElement && altitude !== undefined) {
        const altitudeMiles = (altitude * 0.621371).toFixed(0);
        altElement.textContent = altitudeMiles + ' mi';
    }

    if (velElement && velocity !== undefined) {
        const velocityMph = (velocity * 0.621371).toFixed(0);
        velElement.textContent = velocityMph + ' mph';
    }
}

// ================================================
// CREW PANEL FUNCTIONALITY
// ================================================

async function fetchCrewData() {
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
                    country: null, flagCode: null, agency: null, position: null,
                    launchedTimestamp: null, daysInSpace: null, image: null,
                    bioUrl: null, twitter: null, instagram: null,
                    isIss: p.craft === 'ISS'
                }))
            })
        }
    ];

    for (const endpoint of apiEndpoints) {
        try {
            const response = await fetch(endpoint.url);
            if (!response.ok) throw new Error(`API returned status: ${response.status}`);
            const rawData = await response.json();
            const data = endpoint.transform(rawData);
            if (data.message !== 'success' && !data.people) throw new Error('Invalid response');
            crewData = data;
            return data;
        } catch (error) {
            continue;
        }
    }
    throw new Error('All crew APIs failed');
}

function renderCrewList(data) {
    const crewList = document.getElementById('crew-list');
    const crewCount = document.querySelector('.crew-count');
    const crewUpdated = document.getElementById('crew-updated');

    if (!crewList) return;

    const issCrew = data.people.filter(p => p.isIss || p.craft === 'ISS');
    const otherCrew = data.people.filter(p => !p.isIss && p.craft !== 'ISS');

    if (crewCount) crewCount.textContent = issCrew.length;
    if (crewUpdated) crewUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

    let html = '';
    issCrew.forEach(p => { html += createCrewMemberCard(p); });

    if (otherCrew.length > 0) {
        html += `<div class="crew-section-divider">Other Spacecraft</div>`;
        otherCrew.forEach(p => { html += createCrewMemberCard(p); });
    }

    crewList.innerHTML = html;
}

function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

function formatDaysInSpace(days) {
    if (!days) return null;
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    return months === 0 ? `${years}y` : `${years}y ${months}m`;
}

function formatLaunchDate(timestamp) {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function createCrewMemberCard(person) {
    const avatarHtml = person.image
        ? `<img src="${escapeHtml(person.image)}" alt="${escapeHtml(person.name)}" class="crew-avatar-img" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user-astronaut\\'></i>'">`
        : `<i class="fas fa-user-astronaut"></i>`;

    const flagEmoji = getFlagEmoji(person.flagCode);
    const countryDisplay = person.country ? `<span class="crew-country">${flagEmoji} ${escapeHtml(person.country)}</span>` : '';
    const positionDisplay = person.position ? `<div class="crew-position">${escapeHtml(person.position)}</div>` : '';
    const agencyDisplay = person.agency ? `<span class="crew-agency">${escapeHtml(person.agency)}</span>` : '';

    const daysDisplay = formatDaysInSpace(person.daysInSpace);
    const timeInSpaceHtml = daysDisplay ? `<div class="crew-stat"><i class="fas fa-clock"></i> ${daysDisplay} in space</div>` : '';

    const launchDate = formatLaunchDate(person.launchedTimestamp);
    const launchHtml = launchDate ? `<div class="crew-stat"><i class="fas fa-rocket"></i> Launched ${launchDate}</div>` : '';

    let socialHtml = '';
    if (person.twitter || person.instagram || person.bioUrl) {
        socialHtml = '<div class="crew-social">';
        if (person.twitter) socialHtml += `<a href="https://twitter.com/${escapeHtml(person.twitter)}" target="_blank" rel="noopener" title="Twitter"><i class="fab fa-twitter"></i></a>`;
        if (person.instagram) socialHtml += `<a href="https://instagram.com/${escapeHtml(person.instagram)}" target="_blank" rel="noopener" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        if (person.bioUrl) socialHtml += `<a href="${escapeHtml(person.bioUrl)}" target="_blank" rel="noopener" title="Biography"><i class="fas fa-external-link-alt"></i></a>`;
        socialHtml += '</div>';
    }

    return `
        <div class="crew-member">
            <div class="crew-member-header">
                <div class="crew-avatar">${avatarHtml}</div>
                <div class="crew-member-info">
                    <h3 class="crew-name">${escapeHtml(person.name)}</h3>
                    ${positionDisplay}
                    <div class="crew-meta">${countryDisplay}${agencyDisplay}</div>
                </div>
            </div>
            <div class="crew-details">${timeInSpaceHtml}${launchHtml}</div>
            ${socialHtml}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showCrewError(message) {
    const crewList = document.getElementById('crew-list');
    if (!crewList) return;
    crewList.innerHTML = `
        <div class="crew-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${escapeHtml(message)}</p>
            <button onclick="initCrewPanel()" class="retry-btn" style="margin-top:1rem;padding:0.5rem 1rem;background:#0a3872;border:1px solid #1e5799;color:#7fb1ff;border-radius:4px;cursor:pointer;">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
}

function toggleCrewPanel() {
    const panel = document.getElementById('crew-panel');
    if (panel) panel.classList.toggle('open');
}

async function initCrewPanel() {
    const crewList = document.getElementById('crew-list');
    if (crewList) {
        crewList.innerHTML = `<div class="crew-loading"><i class="fas fa-spinner fa-spin"></i> Loading crew data...</div>`;
    }
    try {
        const data = await fetchCrewData();
        renderCrewList(data);
    } catch (error) {
        showCrewError('Unable to load crew data. Please try again.');
    }
}

function setupCrewPanelEvents() {
    const toggleBtn = document.getElementById('crew-toggle');
    const closeBtn = document.getElementById('crew-close');
    const panel = document.getElementById('crew-panel');

    if (toggleBtn) toggleBtn.addEventListener('click', toggleCrewPanel);
    if (closeBtn) closeBtn.addEventListener('click', toggleCrewPanel);

    document.addEventListener('click', (e) => {
        if (panel && panel.classList.contains('open') && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
            panel.classList.remove('open');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel && panel.classList.contains('open')) {
            panel.classList.remove('open');
        }
    });
}

// ================================================
// LIVE FEED PANEL FUNCTIONALITY
// ================================================

function toggleLiveFeedPanel() {
    const panel = document.getElementById('livefeed-panel');
    if (panel) {
        const isOpening = !panel.classList.contains('open');
        panel.classList.toggle('open');
        if (isOpening && !liveFeedLoaded) loadLiveFeed();
    }
}

function loadLiveFeed() {
    const iframe = document.getElementById('livefeed-iframe');
    if (iframe && iframe.dataset.src) {
        iframe.src = iframe.dataset.src;
        liveFeedLoaded = true;
    }
}

function setupLiveFeedEvents() {
    const toggleBtn = document.getElementById('livefeed-toggle');
    const closeBtn = document.getElementById('livefeed-close');
    const panel = document.getElementById('livefeed-panel');

    if (toggleBtn) toggleBtn.addEventListener('click', toggleLiveFeedPanel);
    if (closeBtn) closeBtn.addEventListener('click', toggleLiveFeedPanel);

    document.addEventListener('click', (e) => {
        if (panel && panel.classList.contains('open') && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
            panel.classList.remove('open');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel && panel.classList.contains('open')) {
            panel.classList.remove('open');
        }
    });
}

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Leaflet map
    initMap();

    // Initialize ISS tracking
    updateISS();
    setInterval(updateISS, 10000);

    // Initialize crew panel
    setupCrewPanelEvents();
    initCrewPanel();
    setInterval(initCrewPanel, 300000);

    // Initialize live feed panel
    setupLiveFeedEvents();
});
