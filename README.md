# Personal Portfolio Website

A modern, animated, single-page portfolio website featuring glassmorphism design with a React/Vite frontend and Node.js/Express backend.

## Features

- **Glassmorphism Design**: Frosted glass UI elements with vibrant cyan/purple accents
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Scroll-triggered animations using Framer Motion
- **Contact Form**: Backend-powered form with email notifications via Nodemailer
- **Project Showcases**:
  - Masonry grid with lightbox for design projects
  - Device mockup frames for web applications
  - Video/GIF support for hardware/IoT projects 

## Tech Stack

### Frontend
- React 18 with Vite
- Framer Motion for animations
- React Intersection Observer for scroll effects
- Lucide React for icons
- Bootstrap (structural only) + Custom CSS

### Backend
- Node.js + Express
- Nodemailer for email handling
- Express Validator for input validation
- Helmet & CORS for security
- Rate limiting for spam protection

## Project Structure

```
IgiegbaBright/
├── backend/
│   ├── server.js          # Express server with contact API
│   ├── package.json       # Backend dependencies
│   └── .env.example       # Environment variables template
│
└── frontend/
    ├── public/
    │   └── favicon.svg
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Hero.jsx
    │   │   ├── About.jsx
    │   │   ├── Skills.jsx
    │   │   ├── Projects.jsx
    │   │   ├── Contact.jsx
    │   │   ├── Footer.jsx
    │   │   ├── Lightbox.jsx
    │   │   └── DynamicBackground.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css      # All glassmorphism styles
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd IgiegbaBright
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install

   # Create environment file
   cp .env.example .env
   # Edit .env with your SMTP credentials

   npm run dev
   ```
   The backend will run on `http://localhost:5000`

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Environment Variables (Backend)

Create a `.env` file in the backend folder:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Where contact form emails will be sent
RECIPIENT_EMAIL=your-email@gmail.com
```

**Note**: For Gmail, you need to use an App Password. Enable 2-Step Verification in your Google Account, then create an App Password at: Google Account > Security > App passwords.

### Development Mode

The backend works without SMTP configuration in development mode. Contact form submissions will be logged to the console instead of sending emails.

## Customization

### Adding Your Own Content

1. **Personal Info**: Update `Contact.jsx` with your email, phone, and location
2. **Projects**: Modify the project arrays in `Projects.jsx`:
   - `designProjects` - Your graphic/brand design work
   - `webProjects` - Your web applications
   - `hardwareProjects` - Your IoT/hardware projects
3. **Skills**: Update skill lists in `Skills.jsx`
4. **About**: Personalize the narrative in `About.jsx`
5. **Images**: Replace placeholder URLs with your actual project images/videos

### Styling

All styles are in `src/index.css`. Key CSS variables:

```css
:root {
  --color-accent-cyan: #00f5ff;    /* Primary accent */
  --color-accent-purple: #a855f7;  /* Secondary accent */
  --color-accent-pink: #ec4899;    /* Tertiary accent */
  --color-bg-primary: #0a0a0f;     /* Main background */
}
```

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```
Output will be in `frontend/dist/`

### Backend
```bash
cd backend
npm start
```

## Deployment

1. **Frontend**: Deploy the `dist` folder to Vercel, Netlify, or similar
2. **Backend**: Deploy to Railway, Render, or any Node.js host
3. **Update CORS**: Set `FRONTEND_URL` in backend `.env` to your production frontend URL

## License

MIT License - feel free to use this template for your own portfolio!

---

Built with passion by Igiegba Bright
