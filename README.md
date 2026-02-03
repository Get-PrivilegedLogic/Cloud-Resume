
# CloudCrafted.dev – Serverless Cloud Resume

[![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=flat&logo=amazon-aws&logoColor=white)]()
[![Serverless](https://img.shields.io/badge/Serverless-%23FD5750.svg?style=flat&logo=serverless&logoColor=white)]()
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/Get-PrivilegedLogic/Cloud-Resume/deploy.yml?style=flat&logo=github-actions&label=CI%2FCD)]()
[![Website](https://img.shields.io/website?down_color=red&down_message=offline&up_color=green&up_message=online&url=https%3A%2F%2Fcloudcrafted.dev)]()
[![HTML5](https://img.shields.io/badge/HTML5-%23E34F26.svg?style=flat&logo=html5&logoColor=white)]()
[![CSS3](https://img.shields.io/badge/CSS3-%231572B6.svg?style=flat&logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-%23F7DF1E.svg?style=flat&logo=javascript&logoColor=black)]()
[![License](https://img.shields.io/github/license/Get-PrivilegedLogic/Cloud-Resume?style=flat)]()


Welcome to **CloudCrafted.dev**, the personal resume site of Brad Herrington – a cloud security engineer with deep expertise in AWS, automation, and identity & access management.

This project was built from the ground up to showcase cloud-native skills using a fully serverless architecture.

---

## 🌐 Live Site
Visit: [https://cloudcrafted.dev](https://cloudcrafted.dev)

---

## 🚀 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Hosting**: Amazon S3 + CloudFront (HTTPS)
- **Contact Form**: Lambda + SES (email delivery)
- **Visitor Counter**: Lambda + DynamoDB + API Gateway
- **DNS**: Route 53
- **SSL**: AWS Certificate Manager

---

## 🛠 Features

- Custom branded domain
- Secure contact form (SES + Lambda)
- Live visit counter (serverless)
- Fully HTTPS-enabled via CloudFront and ACM
- DMARC, DKIM, SPF configured for deliverability
- Clean mobile-friendly responsive design
- Built and deployed entirely within the AWS Free Tier

---

## 📁 File Structure

```
.
├── backend/            # AWS Lambda functions (Python)
├── frontend/           # Static website files
│   ├── index.html      # Main resume page
│   ├── projects.html   # Projects portfolio
│   ├── config.js       # Centralized API configuration [NEW]
│   ├── contact.js      # Form handler (ES Module)
│   ├── counter.js      # Visitor counter (ES Module)
│   ├── script.js       # UI interactions
│   ├── style.css       # Custom styles
│   └── robots.txt      # SEO instructions [NEW]
├── docs/               # Documentation and architecture
└── README.md
```

---

## 🔒 Security Considerations

- No personal email or sensitive identifiers are exposed
- API Gateway endpoints are randomized and CORS-protected
- All secrets and logic handled server-side via AWS Lambda
- SPF, DKIM, and DMARC are fully configured
- No analytics/tracking included by default

---

## 📬 Contact

If you'd like to connect professionally or ask about the project!
> Use the contact form on [https://cloudcrafted.dev](https://cloudcrafted.dev)

---


---

## 📘 Retrospective & Architecture

Curious how this project was built, what problems were solved, and the AWS services involved?  
Dive into the [project retrospective](./docs/Retrospective.md) for a detailed breakdown.

📊 Also see the [architecture diagram](./docs/architecture.png) that visualizes the serverless infrastructure.

---
## 📜 License

This project is licensed for personal portfolio use. You're welcome to use the structure for your own Cloud Resume Challenge.

---

Inspired by the [Cloud Resume Challenge](https://cloudresumechallenge.dev/) by Forrest Brazeal.
