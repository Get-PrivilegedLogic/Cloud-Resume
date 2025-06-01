# 🌍 CloudCrafted ISS Tracker

This project tracks the International Space Station (ISS) in real time using AWS services. The live location is displayed on an interactive map and updated via serverless polling.

## 🛰️ Features
- Real-time position pulled from the Open Notify API
- Interactive map using Leaflet.js
- Optional alert when ISS passes overhead
- Built with: Lambda, DynamoDB, API Gateway, and S3

## 📦 Architecture
- **Lambda**: Fetches ISS coordinates and stores in DynamoDB
- **API Gateway**: Serves position data to frontend
- **DynamoDB**: Stores timestamped coordinate history
- **S3**: Hosts frontend UI
