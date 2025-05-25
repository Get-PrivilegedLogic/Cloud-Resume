
# CloudCrafted.dev – Serverless Cloud Resume

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
├── index.html          # Main resume page
├── contact.js          # Contact form handler (client side)
├── counter.js          # Visitor counter logic
├── style.css           # Custom styles
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

If you'd like to connect professionally or ask about the project:
> Use the contact form on [https://cloudcrafted.dev](https://cloudcrafted.dev)

---

## 📜 License

This project is licensed for personal portfolio use. You're welcome to use the structure for your own Cloud Resume Challenge.

---

Inspired by the [Cloud Resume Challenge](https://cloudresumechallenge.dev/) by Forrest Brazeal.
