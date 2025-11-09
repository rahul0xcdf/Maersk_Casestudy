'use client'

import { motion } from 'framer-motion'
import { Database, MessageCircle, BarChart3, TrendingUp, Users, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
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
          </motion.div>

          {/* Dataset Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
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

          {/* Chat Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
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
        </div>
      </div>

      {/* Footer with Attribution */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="py-6 px-4 text-center border-t"
      >
        <p className="text-sm text-muted-foreground">
          Website developed by <span className="font-semibold text-foreground">Rahul R</span>
        </p>
      </motion.footer>
    </div>
  )
}