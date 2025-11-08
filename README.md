# Olist E-Commerce Analytics Dashboard

A GenAI-powered chat assistant and dashboard for the Brazilian E-Commerce Public Dataset by Olist. Built with Next.js 15, TypeScript, Google Gemini AI, and modern web technologies.

## 🚀 Features

### Dashboard
- **Real-time Analytics**: Interactive charts and visualizations using Recharts
- **Key Metrics**: Total orders, average order value, payment methods distribution
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Multiple Chart Types**: Line charts, bar charts, and pie charts for different data views

### AI Chat Assistant
- **Gemini Integration**: Powered by Google's Vertex AI for intelligent responses
- **Redis Caching**: Fast response times with 1-hour cache TTL
- **Data Context**: Option to include dataset context in AI responses
- **Real-time Chat**: Smooth chat interface with typing indicators

### Technology Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Supabase (PostgreSQL)
- **AI/ML**: Google Gemini (Vertex AI SDK)
- **Caching**: Upstash Redis
- **Charts**: Recharts
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Project with Vertex AI API enabled
- Supabase project (optional, for real data)
- Upstash Redis instance (optional, for caching)

## 🛠️ Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Configure your environment variables in `.env.local`:**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # Google Cloud / Vertex AI Configuration
   GOOGLE_PROJECT_ID=your_google_project_id_here
   
   # Upstash Redis Configuration
   UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url_here
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here
   ```

4. **Set up Google Cloud credentials:**
   - Create a service account in your Google Cloud project
   - Enable the Vertex AI API
   - Download the JSON key file and save it as `gcp-key.json` in the project root
   - Or set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 📊 Dashboard Features

### Summary Cards
- **Total Orders**: All-time order count with trend indicators
- **Average Order Value**: Per-order average with growth metrics
- **Most Common Payment**: Popular payment methods
- **Active Months**: Timeline coverage

### Interactive Charts
- **Orders per Month**: Line chart showing order trends
- **Revenue per Month**: Bar chart displaying monthly revenue
- **Payment Methods**: Pie chart of payment distribution
- **Product Categories**: Category-wise order distribution

## 🤖 AI Assistant Features

### Chat Capabilities
- **Natural Language Processing**: Ask questions about the dataset
- **Data Context**: Toggle to include actual dataset information
- **Cached Responses**: Fast responses with Redis caching
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### Sample Questions
- "What are the most popular product categories?"
- "What's the average order value?"
- "Which payment methods are most common?"
- "How have sales changed over time?"

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/chat/
│   │   └── route.ts          # Chat API endpoint with caching
│   ├── page.tsx              # Main dashboard and chat page
│   ├── layout.tsx            # Root layout with metadata
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── DashboardCard.tsx     # Summary metric cards
│   ├── Chart.tsx             # Recharts wrapper component
│   └── ChatUI.tsx            # Chat interface component
└── lib/
    ├── supabase.ts           # Supabase client configuration
    ├── redis.ts              # Redis client and cache utilities
    └── gemini.ts             # Gemini AI integration
```

## 🔧 Configuration

### Supabase Setup (Optional)
1. Create a new project at [supabase.com](https://supabase.com)
2. Create an `orders` table with the schema defined in `lib/supabase.ts`
3. Copy your project URL and keys to `.env.local`

### Google Vertex AI Setup
1. Create a Google Cloud project
2. Enable the Vertex AI API
3. Create a service account with Vertex AI permissions
4. Download the JSON key file

### Upstash Redis Setup (Optional)
1. Create a free Redis database at [upstash.com](https://upstash.com)
2. Copy your REST URL and token to `.env.local`

## 🚀 Deployment

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production
- All variables from `.env.local`
- `GOOGLE_APPLICATION_CREDENTIALS` as a JSON string or use Vercel's file upload

## 📝 Development Notes

### Mock Data
The application includes mock data for demonstration purposes. When connected to real services:
- Supabase provides actual order data
- Redis caches AI responses for performance
- Gemini provides contextual AI responses

### Performance Optimizations
- Redis caching with 1-hour TTL
- Responsive images and lazy loading
- Optimized bundle size with Next.js
- Efficient re-renders with React hooks

### Error Handling
- Graceful API error handling
- Fallback responses for development
- User-friendly error messages
- Toast notifications for user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the environment variables are correctly set
2. Ensure all APIs are enabled and accessible
3. Review the browser console for error messages
4. Check the development server logs

---

**Built with ❤️ using Next.js 15, TypeScript, and modern web technologies**