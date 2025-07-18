# Sculpt - AI Fitness & Nutrition Coach

A mobile-first fitness and nutrition application with AI-powered coaching, built with Next.js, Express.js, and Supabase.

## Features

- 🤖 **AI Coaching**: Personalized fitness and nutrition advice from OpenAI
- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive UI
- 💪 **Workout Tracking**: Log and track your workouts with AI-generated plans
- 🥗 **Nutrition Tracking**: Monitor your diet with AI meal recommendations
- 📊 **Progress Visualization**: Track your fitness journey with charts and badges
- 🎨 **Modern UI**: Beautiful interface built with Radix UI and Tailwind CSS
- 💾 **Local Storage**: Data persistence without authentication requirements

## Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components
- **React Hook Form** - Form handling
- **Recharts** - Data visualization

### Backend
- **Express.js** - Node.js web framework
- **Supabase** - Database and storage
- **OpenAI** - AI coaching integration
- **JWT** - Authentication (if needed)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sculpt
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Environment Setup**

   Create `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   ```

   Create `.env` in the backend directory:
   ```env
   PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

5. **Database Setup**
   - Create a new Supabase project
   - Apply the database schema from `supabase-schema-safe.sql`
   - Update environment variables with your Supabase credentials

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
sculpt/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── chat-interface.tsx
│   ├── dashboard-page.tsx
│   └── ...
├── backend/              # Express.js backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   └── server.js     # Server entry point
│   └── package.json
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
└── public/               # Static assets
```

## Usage

1. **User Settings**: Start by entering your personal information in the Settings tab
2. **AI Chat**: Ask the AI coach for fitness and nutrition advice
3. **Workout Tracking**: Log your workouts and view AI-generated plans
4. **Diet Tracking**: Monitor your nutrition and get meal recommendations
5. **Progress**: View your fitness journey with charts and achievements

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 