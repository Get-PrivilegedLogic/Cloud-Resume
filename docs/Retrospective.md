# CloudCrafted.dev: My Serverless Cloud Resume Journey

## 🚀 Project Overview  
Over the past few weeks, I built **CloudCrafted.dev**, my personal resume site powered entirely by AWS serverless technologies. Here’s a quick look at the components:

- **Static Frontend**: HTML, CSS, and JavaScript on S3, served via CloudFront  
- **Visitor Counter**: AWS Lambda + API Gateway + DynamoDB  
- **Contact Form**: AWS Lambda + API Gateway + Amazon SES  
- **CI/CD Pipeline**: GitHub Actions to automate S3 sync and CloudFront invalidations  
- **Security Hardening**: Private S3 bucket with Origin Access Control (OAC), scoped IAM roles, CORS restrictions, and locked-down infrastructure

---

## 🛠️ Step-by-Step Highlights

1. **Protecting My Privacy & Crafting HTML**  
   - I removed personal details (phone, exact location, employer names)  
   - Built a clean `index.html` with semantic sections: Summary, Skills, Experience, Education, Certifications  
   - Masked my email behind a contact form and linked to my public GitHub

2. **Hosting on S3 + CloudFront**  
   - Started with S3 website hosting, then transitioned to a private bucket + OAC for stronger security  
   - Applied DNS via Route 53, secured with ACM certificates, and pointed my domain `cloudcrafted.dev` to CloudFront

3. **Building the Visitor Counter**  
   - Wrote a Lambda function to read/update a DynamoDB item, including custom Decimal→int JSON conversion  
   - Exposed it through API Gateway and debugged CORS errors by locking `Access-Control-Allow-Origin` to my domain

4. **Implementing the Contact Form**  
   - Created a Lambda using Boto3 to send email via SES (from `noreply@cloudcrafted.dev`)  
   - Added client-side validation, form clearing, and user feedback  
   - Secured CORS and applied least-privilege IAM policies

5. **Branding & Logo Exploration**  
   - Experimented with several logo designs but ultimately deferred to a minimal, text-focused layout for performance  
   - Decided to skip the logo to maintain simplicity and speed

6. **Automating with GitHub Actions**  
   - Stored AWS credentials and resource IDs in GitHub Secrets  
   - Wrote a workflow to `aws s3 sync frontend/` → private bucket, then `create-invalidation` on CloudFront  
   - Troubleshot path issues and reconciled ACLs vs. OAC

7. **Final Security Hardening**  
   - Switched to a private S3 bucket (ACLs disabled) with CloudFront OAC  
   - Crafted a bucket policy to strictly allow only my CloudFront distribution to `s3:GetObject`  
   - Verified CORS, CSP, SES settings, IAM roles, and turned off S3 static hosting

---

## 🔑 Key Lessons Learned

1. **Folder Structure Is Critical**  
   Syncing `./frontend/` vs. `.` can accidentally nest files under unwanted prefixes. I learned to always verify object paths after the first CI run.

2. **Modern S3 Ownership Model**  
   AWS now disables ACLs by default. For a private bucket + OAC, you must drop all `--acl` flags and rely solely on bucket policies.

3. **CORS Precision**  
   Browsers silently block missing `Access-Control-Allow-Origin` headers. Lock it down to your domain, then test in an incognito window.

4. **Exact Policy Matching for OAC**  
   The `AWS:SourceArn` in the bucket policy must exactly match the CloudFront distribution ARN—any typo leads to a cryptic `AccessDenied`.

5. **Invalidate Caches Religiously**  
   After permissions or origin changes, always invalidate CloudFront’s cache to avoid staging stale errors.

6. **Automate Early to Reveal Gaps**  
   Building CI/CD exposed manual misconfigurations (e.g., leftover static-hosting settings, inconsistent object ACLs). Automation helps catch those.

---

## ✨ Interesting Discoveries

- **Decimal Serialization**: DynamoDB returns `Decimal` objects that need custom conversion for JSON.  
- **OAC vs. OAI**: AWS’s new Origin Access Control is more secure but requires precise bucket policies.  
- **GitHub Secrets**: Missing environment secrets (`S3_BUCKET`, `DISTRIBUTION_ID`) led to silent CI failures.  
- **Static Hosting Conflicts**: S3 website hosting can conflict with a private-bucket + CloudFront setup and should be disabled.

---

## 🎯 Final Thoughts

With **CloudCrafted.dev**, I’ve created a production-grade, serverless resume site that:

- Demonstrates AWS best practices (OAC, least-privilege IAM, serverless patterns)  
- Automates deployments via GitHub Actions  
- Balances security with performance  
- Stays within the AWS Free Tier

I’m proud of this project’s depth and polish. My next step is sharing this journey on my blog and LinkedIn to help other cloud professionals learn from my experience.
