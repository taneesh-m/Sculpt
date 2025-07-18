#!/bin/bash

echo "🚀 Setting up FitNutrition App"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "📦 Installing frontend dependencies..."
pnpm install

echo "📦 Installing backend dependencies..."
cd backend
pnpm install
cd ..

echo "✅ Dependencies installed successfully!"

echo ""
echo "🔧 Next steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Run the database schema from backend/supabase-schema.sql in your Supabase SQL editor"
echo "3. Copy backend/env.example to backend/.env and update with your Supabase credentials"
echo "4. Copy .env.example to .env.local and update with your credentials"
echo "5. Get an OpenAI API key from https://platform.openai.com"
echo ""
echo "🚀 To start the application:"
echo "  Backend:  cd backend && pnpm dev"
echo "  Frontend: pnpm dev"
echo ""
echo "📖 See README.md for detailed instructions" 