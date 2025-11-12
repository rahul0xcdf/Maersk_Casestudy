'use client'

import { motion } from 'framer-motion'
import { Database, MessageCircle, BarChart3, TrendingUp, Users, ShoppingCart, Github, Linkedin, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated Background Charts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {/* Floating Bar Chart 1 */}
        <motion.div
          className="absolute"
          initial={{ x: -100, y: 100, rotate: -15 }}
          animate={{
            x: [null, 200, -100],
            y: [null, 50, 100],
            rotate: [-15, 10, -15],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
            <rect x="10" y="50" width="15" height="30" fill="currentColor" className="text-primary" />
            <rect x="30" y="30" width="15" height="50" fill="currentColor" className="text-primary" />
            <rect x="50" y="20" width="15" height="60" fill="currentColor" className="text-primary" />
            <rect x="70" y="40" width="15" height="40" fill="currentColor" className="text-primary" />
            <rect x="90" y="25" width="15" height="55" fill="currentColor" className="text-primary" />
          </svg>
        </motion.div>

        {/* Floating Bar Chart 2 */}
        <motion.div
          className="absolute"
          initial={{ x: '100%', y: 200, rotate: 15 }}
          animate={{
            x: ['100%', 'calc(100% - 300px)', '100%'],
            y: [200, 100, 200],
            rotate: [15, -10, 15],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width="100" height="70" viewBox="0 0 100 70" fill="none">
            <rect x="15" y="40" width="12" height="30" fill="currentColor" className="text-primary" />
            <rect x="32" y="25" width="12" height="45" fill="currentColor" className="text-primary" />
            <rect x="49" y="15" width="12" height="55" fill="currentColor" className="text-primary" />
            <rect x="66" y="35" width="12" height="35" fill="currentColor" className="text-primary" />
            <rect x="83" y="20" width="12" height="50" fill="currentColor" className="text-primary" />
          </svg>
        </motion.div>

        {/* Floating Line Chart 1 */}
        <motion.div
          className="absolute"
          initial={{ x: 150, y: -50, rotate: 5 }}
          animate={{
            x: [150, 400, 150],
            y: [-50, 150, -50],
            rotate: [5, -8, 5],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width="140" height="60" viewBox="0 0 140 60" fill="none">
            <path
              d="M 10 45 L 25 35 L 40 20 L 55 30 L 70 15 L 85 25 L 100 10 L 115 20 L 130 15"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-primary"
            />
            <circle cx="10" cy="45" r="3" fill="currentColor" className="text-primary" />
            <circle cx="25" cy="35" r="3" fill="currentColor" className="text-primary" />
            <circle cx="40" cy="20" r="3" fill="currentColor" className="text-primary" />
            <circle cx="55" cy="30" r="3" fill="currentColor" className="text-primary" />
            <circle cx="70" cy="15" r="3" fill="currentColor" className="text-primary" />
            <circle cx="85" cy="25" r="3" fill="currentColor" className="text-primary" />
            <circle cx="100" cy="10" r="3" fill="currentColor" className="text-primary" />
            <circle cx="115" cy="20" r="3" fill="currentColor" className="text-primary" />
            <circle cx="130" cy="15" r="3" fill="currentColor" className="text-primary" />
          </svg>
        </motion.div>

        {/* Floating Line Chart 2 */}
        <motion.div
          className="absolute"
          initial={{ x: -80, y: '60%', rotate: -10 }}
          animate={{
            x: [-80, 250, -80],
            y: ['60%', '40%', '60%'],
            rotate: [-10, 12, -10],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width="130" height="55" viewBox="0 0 130 55" fill="none">
            <path
              d="M 5 50 L 20 45 L 35 30 L 50 20 L 65 35 L 80 15 L 95 25 L 110 10 L 125 20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-primary"
            />
            <circle cx="5" cy="50" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="20" cy="45" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="35" cy="30" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="50" cy="20" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="65" cy="35" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="80" cy="15" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="95" cy="25" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="110" cy="10" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="125" cy="20" r="2.5" fill="currentColor" className="text-primary" />
          </svg>
        </motion.div>

        {/* Floating Bar Chart 3 */}
        <motion.div
          className="absolute"
          initial={{ x: '80%', y: '20%', rotate: 8 }}
          animate={{
            x: ['80%', '50%', '80%'],
            y: ['20%', '35%', '20%'],
            rotate: [8, -12, 8],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width="110" height="75" viewBox="0 0 110 75" fill="none">
            <rect x="12" y="45" width="14" height="30" fill="currentColor" className="text-primary" />
            <rect x="30" y="30" width="14" height="45" fill="currentColor" className="text-primary" />
            <rect x="48" y="15" width="14" height="60" fill="currentColor" className="text-primary" />
            <rect x="66" y="35" width="14" height="40" fill="currentColor" className="text-primary" />
            <rect x="84" y="25" width="14" height="50" fill="currentColor" className="text-primary" />
          </svg>
        </motion.div>

        {/* Floating Line Chart 3 */}
        <motion.div
          className="absolute"
          initial={{ x: 300, y: '80%', rotate: -5 }}
          animate={{
            x: [300, 50, 300],
            y: ['80%', '60%', '80%'],
            rotate: [-5, 15, -5],
          }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg width="125" height="50" viewBox="0 0 125 50" fill="none">
            <path
              d="M 8 40 L 22 35 L 36 20 L 50 28 L 64 12 L 78 22 L 92 8 L 106 18 L 120 12"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-primary"
            />
            <circle cx="8" cy="40" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="22" cy="35" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="36" cy="20" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="50" cy="28" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="64" cy="12" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="78" cy="22" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="92" cy="8" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="106" cy="18" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="120" cy="12" r="2.5" fill="currentColor" className="text-primary" />
          </svg>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="container max-w-4xl mx-auto text-center">
          {/* Animated Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <Database className="h-16 w-16 text-primary mx-auto" />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
              Brazilian E-Commerce
              <span className="block text-primary mt-2">Olist Dataset</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore insights from one of Brazil's largest e-commerce datasets
            </p>
            <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto">
              This is MAERSK Case study Gen AI tool built by Rahul R PES University
            </p>
          </motion.div>

          {/* Chat Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-12"
          >
            <Link href="/chat">
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto group"
                asChild
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3"
                >
                  <MessageCircle className="h-6 w-6 group-hover:animate-pulse" />
                  Chat with Datasets
                  <TrendingUp className="h-5 w-5 opacity-70" />
                </motion.div>
              </Button>
            </Link>
          </motion.div>

          {/* Dataset Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 rounded-lg border bg-card text-card-foreground"
            >
              <ShoppingCart className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">100K+ Orders</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive order data from 2016-2018
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 rounded-lg border bg-card text-card-foreground"
            >
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Multiple Entities</h3>
              <p className="text-sm text-muted-foreground">
                Customers, sellers, products, and reviews
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 rounded-lg border bg-card text-card-foreground"
            >
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Rich Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Payments, geolocation, and product categories
              </p>
            </motion.div>
          </motion.div>

          {/* Dataset Link Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <a
              href="https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce/"
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="outline"
                size="lg"
                className="text-base px-6 py-3 h-auto group"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2"
                >
                  <Database className="h-5 w-5" />
                  View Dataset on Kaggle
                  <ExternalLink className="h-4 w-4 opacity-70" />
                </motion.div>
              </Button>
            </a>
          </motion.div>
        </div>
      </div>

      {/* Footer with Attribution */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="py-6 px-4 text-center border-t relative z-10"
      >
        <div className="flex items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">
            Built the tool by <span className="font-semibold text-foreground">Rahul R</span>
          </p>
          <a
            href="https://github.com/rahul0xcdf/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
            aria-label="GitHub"
            title="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/rahul0xcdf/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
      </motion.footer>
    </div>
  )
}