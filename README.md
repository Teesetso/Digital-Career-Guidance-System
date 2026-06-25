## Project Overview

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
npm install
3. Set up environment variables:
cp .env.example .env
//Fill in your own values for database, APIs, email, and cloud services.
4.Run the application:
-npm start

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
