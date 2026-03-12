# Smart Campus Complaint Portal

A comprehensive, digital platform designed to help students report, track, and resolve campus issues efficiently. The system streamlines the complaint resolution flow for campus administration and students alike, cutting down on physical paperwork and providing live tracking updates.

## 🚀 Features

### For Students
- **Real-Time Complaint Submission:** Report issues related to academics, hostels, IT, or general campus maintenance with varying priority levels.
- **Categorized Complaints:** Route the issue exactly to the department that handles it for faster resolution times.
- **Live Status Tracking:** Track your complaint status from `Pending`, to `In Progress`, to `Resolved`.
- **Integrated AI Support Chatbot:** Quick access to campus FAQs and basic support through an embedded chatbot.
- **Personal Dashboard:** Review your total submissions and analytics at a glance.

### For Administrators
- **Centralized Dashboard:** Monitor the live count of complaints across the entire campus.
- **Dynamic Status Management:** Manually update complaint statuses to keep students informed simultaneously.
- **Complaint Filtering:** Search, filter, and sort issues by category or urgency to prioritize critical campus challenges.

## 🛠️ Tech Stack & Deployment

- **Frontend:** HTML5, CSS3, JavaScript (ES6+).
  - **Deployed on:** [Netlify](https://www.netlify.com/)
- **Backend:** Node.js, Express.js.
  - **Deployed on:** [Vercel](https://vercel.com/)
- **Database:** PostgreSQL & Real-Time Functionality.
  - **Deployed on:** [Supabase](https://supabase.com/)

---

## 💻 Local Setup & Development

If you wish to clone and run this project locally, ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-campus-complaint-portal.git
cd smart-campus-complaint-portal
```

### 2. Supabase Configuration (Database)
You will need to create a project on Supabase and set up your tables:
- `users`: Track student and admin credentials.
- `complaints`: Track submission data, statuses, and categories.

### 3. Backend Setup (Local)
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file in the `backend` folder and add your Supabase credentials:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret
   ```
3. Start the local server:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup (Local)
1. Navigate to the `frontend/config.js` file (or wherever your API URLs are stored).
2. Change the production Vercel URL to your local backend URL:
   ```javascript
   // Change from your Vercel URL context to localhost during development
   const API_BASE_URL = 'http://localhost:5000';
   ```
3. Open `frontend/index.html` in a browser or use a tool like **Live Server** (VS Code extension) to start the interface.

## 🤝 Contribution
Contributions, issues, and feature requests are always welcome! Feel free to check the issues page if you want to contribute.

## 📝 License
This project is open-source and free to use.

---
*Built to simplify campus communication.*
