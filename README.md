# Brazilian E-Commerce Analytics - GenAI Case Study

> **Case Study Project for Maersk AP Moller**  
> Built by **Rahul R** from **PES University**

A GenAI-powered analytics platform for exploring the Brazilian E-Commerce Olist dataset. This project demonstrates advanced AI capabilities including natural language SQL generation, conversational chat with memory, and intelligent data visualizations.

**🌐 Live Application:** [https://apmollar-casestudy.vercel.app/](https://apmollar-casestudy.vercel.app/)

**📹 Demo Video:** [Watch on YouTube](https://youtu.be/nFOj3s7Kgj4)

**📊 Dataset:** [Kaggle - Brazilian E-Commerce Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce/)

---

## 🎯 Project Overview

This is a comprehensive GenAI case study that transforms natural language questions into SQL queries, executes them on a real database, and presents results through interactive visualizations. The system features continuous conversation memory, intelligent caching, and a seamless user experience.

## ✨ Key Features

### 🤖 **Intelligent Chat with Memory**
- **Conversational Continuity**: The AI remembers previous queries and context throughout the conversation
- **Context-Aware Responses**: Follow-up questions like "and by state" or "top 5" work seamlessly
- **Dual Mode Operation**: 
  - **Chat Mode**: General questions about the dataset
  - **Query Mode**: Data analytics with SQL generation and visualizations

### 📊 **Advanced Visualizations**
- **Multiple Chart Types**: Bar charts, line charts, pie charts, tables, and metrics
- **Auto-Detection**: Automatically selects the best visualization type based on data
- **Interactive Analytics**: Click on any result to view detailed visualizations
- **Real-time Data**: Direct queries to Supabase PostgreSQL database

### ⚡ **Performance & Caching**
- **Redis Caching**: Fast response times with intelligent caching (1-hour TTL)
- **Query Optimization**: Efficient SQL generation and execution
- **Responsive Design**: Mobile-first, optimized for all devices
- **Instant Results**: Cached responses load instantly for repeated queries

### 🔄 **Conversational Features**
- **Chat Memory**: Maintains conversation history for context-aware responses
- **Follow-up Questions**: Natural follow-ups like "show me top 5" or "compare to last year"
- **Smart Context**: AI understands references to previous queries and results
- **Visualization Analysis**: Ask questions about displayed charts and data

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible component library
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Interactive data visualizations

### Backend & AI
- **Next.js API Routes** - Serverless API endpoints
- **Google Gemini AI** - Natural language processing and SQL generation
- **Supabase (PostgreSQL)** - Database and RPC functions
- **Upstash Redis** - High-performance caching layer

### Deployment
- **Vercel** - Serverless deployment platform
- **Environment Variables** - Secure configuration management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google AI Studio API key
- Supabase account (free tier works)
- Upstash Redis account (free tier works)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Maersk
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Configure `.env.local`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Google AI Studio
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   GEMINI_MODEL_NAME=gemini-pro

   # Upstash Redis
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   ```

4. **Set up the database:**
   - See [SETUP.md](./SETUP.md) for detailed database setup instructions
   - Import the Olist dataset into Supabase
   - Create the `execute_sql` RPC function

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## 📋 Features in Detail

### 1. Natural Language to SQL
- Ask questions in plain English
- AI generates optimized PostgreSQL queries
- Automatic query validation and safety checks
- Support for complex aggregations, joins, and filters

### 2. Chat Memory & Context
- **Conversation History**: Last 10 messages maintained in context
- **Context-Aware SQL**: Follow-up queries reference previous results
- **Smart References**: Understands "top category", "those results", etc.
- **Seamless Continuation**: Natural conversation flow without repetition

### 3. Intelligent Visualizations
- **Auto-Detection**: Chooses chart type based on data structure
- **Multiple Formats**: 
  - Bar charts for categorical comparisons
  - Line charts for time series
  - Pie charts for distributions
  - Tables for detailed data
  - Metrics for single values
- **Interactive Analysis**: Click to view full visualizations
- **Chart Insights**: Ask questions about displayed charts

### 4. Performance Optimization
- **Redis Caching**: 
  - 1-hour TTL for query results
  - Instant responses for repeated questions
  - Reduced API calls and costs
- **Query Optimization**: Efficient SQL generation
- **Lazy Loading**: Components load on demand
- **Responsive Design**: Fast on all devices

## 🎨 User Experience

### Chat Interface
- Clean, modern chat UI
- Real-time typing indicators
- Message history persistence (localStorage)
- Smooth animations and transitions

### Analytics Dashboard
- Resizable panels for charts and chat
- Quick access to visualizations
- SQL query display
- Export capabilities

## 📊 Dataset Information

The Brazilian E-Commerce Olist Dataset contains:
- **100K+ Orders** from 2016-2018
- **Multiple Entities**: Customers, sellers, products, reviews
- **Rich Analytics**: Payments, geolocation, product categories
- **Comprehensive Data**: Order status, delivery times, review scores

**Dataset Source:** [Kaggle - Brazilian E-Commerce Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce/)

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # Chat API with memory
│   │   ├── query/          # SQL query API
│   │   └── clear-cache/    # Cache management
│   ├── chat/              # Chat page
│   └── page.tsx           # Home page
├── components/
│   ├── ChatUI.tsx         # Main chat interface
│   ├── QueryResult.tsx   # Visualization component
│   ├── Chart.tsx          # Chart wrapper
│   └── ui/                # shadcn/ui components
└── lib/
    ├── gemini.ts          # Gemini AI integration
    ├── sql-generator.ts   # SQL generation with context
    ├── chat-handlers.ts   # Chat response processing
    ├── supabase.ts        # Database client
    └── redis.ts           # Caching utilities
```

## 🔧 Configuration

### Google AI Studio Setup
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add to `.env.local` as `GOOGLE_AI_API_KEY`

### Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Run schema SQL from `db/` directory
3. Import dataset CSV files
4. Create `execute_sql` RPC function

### Redis Setup
1. Create database at [upstash.com](https://upstash.com)
2. Copy REST URL and token
3. Add to `.env.local`

See [SETUP.md](./SETUP.md) for detailed instructions.

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

The application is live at: [https://apmollar-casestudy.vercel.app/](https://apmollar-casestudy.vercel.app/)

## 📝 Example Queries

### Analytics Queries
- "Show me revenue trends by month"
- "Which product categories perform best?"
- "What payment methods are most popular?"
- "Top 5 customer locations by order count"
- "Average delivery time by state"

### Follow-up Queries (with memory)
- "And by state" (after asking about revenue)
- "Top 5" (after any list query)
- "Compare to last year" (after time-based query)
- "Show as bar chart" (after data query)

### Chat Queries
- "What is this dataset about?"
- "How can I analyze product categories?"
- "Explain the payment methods"

## 🎓 Case Study Highlights

This project demonstrates:
- **GenAI Integration**: Natural language to SQL conversion
- **Conversational AI**: Context-aware chat with memory
- **Data Visualization**: Intelligent chart selection and rendering
- **Performance**: Caching strategies for fast responses
- **Full-Stack Development**: Modern Next.js architecture
- **Database Design**: Efficient PostgreSQL schema and queries

## 🤝 Contributing

This is a case study project. For questions or feedback, please reach out.

## 📄 License

This project is part of a case study for Maersk AP Mollar.

## 👤 Author

**Rahul R**  
PES University  
[GitHub](https://github.com/rahul0xcdf/) | [LinkedIn](https://www.linkedin.com/in/rahul0xcdf/)

## 🔮 Future Enhancements

If time permits, the following features are planned for future implementation:

- **New Chat Features**: Enhanced conversational capabilities with improved context understanding
- **Report Extraction**: Ability to export and extract comprehensive analytics reports
- **Better Visualization**: Advanced chart types, interactive dashboards, and improved data presentation

---

**Built with ❤️ for Maersk AP Mollar Case Study**
