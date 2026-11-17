<img width="1339" height="677" alt="image" src="https://github.com/user-attachments/assets/549d0ecd-df83-4528-b12e-6e0f85530dd3" />## Project Overview

The **Digital Career Guidance System (DCGS)** is a web-based platform designed to help students and professionals navigate their career paths with structured guidance, resources, and analytics.  


### 🎯 Purpose
- Provide personalized career recommendations based on user profiles.
- Centralize information about universities, courses, and career opportunities.
- Offer tools for administrators to manage data and track system analytics.

### ⚙️ Key Features
- **User Management** → Admins can add, edit, and manage users, universities, and courses.
- **Bulk Import** → CSV upload for large datasets (universities, courses).
- **Analytics Dashboard** → System statistics and usage insights.
- **Secure Authentication** → JWT-based login and session management.
- **Integration Ready** → Supports AI APIs (Gemini, Groq, Pinecone) for intelligent recommendations.
- **Email & Cloud Support** → Gmail SMTP and Cloudinary integration for communication and media storage.

### 🛠️ Tech Stack
- **Backend**: Node.js, Express.js  
- **Frontend**: EJS templates  
- **Database**: SQL (schema and seed files included)  
- **Testing**: Integration tests with Jest  
- **Authentication**: JWT + bcrypt security  
- **Cloud Services**: Cloudinary, Gmail SMTP  
- **AI APIs**: Gemini, Groq, Pinecone  

### 🚀 Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/Teesetso/Digital-Career-Guidance-System.git
   cd Digital-Career-Guidance-System

2. Install dependencies:
 ```
npm install
 ```
3. Set up environment variables:
 ```
cp .env.example .env
 ```
//Fill in your own values for database, APIs, email, and cloud services.
4.Run the application:
 ```
npm start
 ```
⚙️ Environment Setup
This project uses environment variables to manage secrets and configuration.

.env → contains your real secrets (API keys, passwords, tokens). This file is ignored by Git and should never be pushed.

.env.example → contains only placeholders. Safe to commit, so collaborators know what variables to set up.

📌 Roadmap
✅ Core database schema and API endpoints

✅ Admin dashboard for user/course management

✅ JWT authentication and session handling

🔜 Student dashboard with personalized career recommendations

🔜 AI-powered guidance using Gemini, Groq, Pinecone APIs

🔜 Mobile-friendly UI

📄 License
This project is licensed under the MIT License — feel free to use, modify, and distribute with attribution.
<img width="1337" height="634" alt="image" src="https://github.com/user-attachments/assets/391d8c19-4177-45fd-85d2-89514f05b4c0" />
<img width="1350" height="639" alt="image" src="https://github.com/user-attachments/assets/03c5b27c-2616-4f69-90a3-be99202c864e" />
<img width="1355" height="649" alt="image" src="https://github.com/user-attachments/assets/e4681924-97c9-44f2-a4e2-2008b43b1e90" />
<img width="1359" height="633" alt="image" src="https://github.com/user-attachments/assets/cefa2099-3221-45e4-88c2-b7e64bdb545f" />






