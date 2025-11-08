'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardCard } from '@/components/DashboardCard'
import { Chart } from '@/components/Chart'
import { ChatUI } from '@/components/ChatUI'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingCart, TrendingUp, CreditCard, Calendar, BarChart3 } from 'lucide-react'

// Mock data for demonstration
const mockOrdersData = [
  { name: 'Jan', orders: 1200, value: 45000 },
  { name: 'Feb', orders: 1350, value: 52000 },
  { name: 'Mar', orders: 1100, value: 41000 },
  { name: 'Apr', orders: 1500, value: 58000 },
  { name: 'May', orders: 1650, value: 63000 },
  { name: 'Jun', orders: 1400, value: 54000 },
  { name: 'Jul', orders: 1550, value: 59000 },
  { name: 'Aug', orders: 1700, value: 65000 },
  { name: 'Sep', orders: 1600, value: 61000 },
  { name: 'Oct', orders: 1800, value: 69000 },
  { name: 'Nov', orders: 2100, value: 82000 },
  { name: 'Dec', orders: 2300, value: 91000 }
]

const mockPaymentMethods = [
  { name: 'Credit Card', value: 65 },
  { name: 'Boleto', value: 20 },
  { name: 'Debit Card', value: 10 },
  { name: 'Voucher', value: 5 }
]

const mockCategories = [
  { name: 'Electronics', value: 25 },
  { name: 'Fashion', value: 20 },
  { name: 'Home & Garden', value: 15 },
  { name: 'Sports', value: 12 },
  { name: 'Books', value: 10 },
  { name: 'Toys', value: 8 },
  { name: 'Health', value: 6 },
  { name: 'Other', value: 4 }
]

export default function Home() {
  const [totalOrders, setTotalOrders] = useState(0)
  const [avgOrderValue, setAvgOrderValue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Calculate mock statistics
    const total = mockOrdersData.reduce((sum, month) => sum + month.orders, 0)
    const totalValue = mockOrdersData.reduce((sum, month) => sum + month.value, 0)
    const avgValue = totalValue / total

    setTotalOrders(total)
    setAvgOrderValue(avgValue)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Brazilian E-Commerce Public Dataset by Olist
          </h1>
          <p className="text-lg text-muted-foreground max-w-4xl">
            Welcome! This is a Brazilian ecommerce public dataset of orders made at Olist Store. 
            The dataset has information of 100k orders from 2016 to 2018 made at multiple marketplaces in Brazil. 
            Its features allow viewing an order from multiple dimensions: from order status, price, payment and freight 
            performance to customer location, product attributes, and finally reviews written by customers.
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="Total Orders"
                value={totalOrders.toLocaleString()}
                description="All time orders"
                icon={ShoppingCart}
                trend={{ value: 12.5, isPositive: true }}
              />
              <DashboardCard
                title="Average Order Value"
                value={`R$ ${avgOrderValue.toFixed(2)}`}
                description="Per order average"
                icon={TrendingUp}
                trend={{ value: 8.2, isPositive: true }}
              />
              <DashboardCard
                title="Most Common Payment"
                value="Credit Card"
                description="65% of all payments"
                icon={CreditCard}
                trend={{ value: 2.1, isPositive: true }}
              />
              <DashboardCard
                title="Active Months"
                value="12"
                description="Months with orders"
                icon={Calendar}
                trend={{ value: 0, isPositive: true }}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Chart
                title="Orders per Month"
                data={mockOrdersData}
                type="line"
                dataKey="orders"
                height={350}
              />
              <Chart
                title="Revenue per Month"
                data={mockOrdersData}
                type="bar"
                dataKey="value"
                height={350}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Chart
                title="Payment Methods Distribution"
                data={mockPaymentMethods}
                type="pie"
                height={300}
              />
              <Chart
                title="Product Categories"
                data={mockCategories}
                type="pie"
                height={300}
              />
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChatUI className="h-[600px]" />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Start</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Try asking these questions:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-muted rounded">
                        "What are the most popular product categories?"
                      </div>
                      <div className="p-2 bg-muted rounded">
                        "What's the average order value?"
                      </div>
                      <div className="p-2 bg-muted rounded">
                        "Which payment methods are most common?"
                      </div>
                      <div className="p-2 bg-muted rounded">
                        "How have sales changed over time?"
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dataset Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period:</span>
                      <span>2016-2018</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orders:</span>
                      <span>100k+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Markets:</span>
                      <span>Multiple</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coverage:</span>
                      <span>Brazil</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}