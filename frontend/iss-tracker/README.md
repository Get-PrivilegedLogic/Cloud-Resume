# 🌍 NASA-Style ISS Tracker

This project tracks the International Space Station (ISS) in real time, displaying its position on a static NASA-style world map. The tracker shows orbital data and creates a visual path of the ISS trajectory.

## 🛰️ Features
- Real-time position data from the WhereTheISS.at API
- NASA-style static world map with coordinate grid
- Visual orbit path tracking with date line crossing handling
- Dynamic display of latitude, longitude, altitude, and velocity
- Smooth animation with pulsing ISS icon
- Fully responsive design for all screen sizes

## 🚀 Implementation
- **Pure JavaScript**: No external mapping libraries
- **SVG Visualization**: Dynamic orbit path rendering using SVG
- **Coordinate Projection**: Custom latitude/longitude to screen position mapping
- **RESTful API**: Direct integration with ISS tracking data
- **CSS Grid System**: NASA-style coordinate overlay

## 📡 How It Works
The tracker fetches the current ISS position every 10 seconds and updates the display. It plots the position on a static world map using absolute positioning calculated from latitude and longitude. The orbit path is stored and displayed using SVG paths, with special handling to prevent visual issues when crossing the international date line.
