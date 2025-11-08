'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/Chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Code, Database, TrendingUp, BarChart3, PieChart, Map, Table2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface QueryResultProps {
  sql: string
  explanation: string
  data: any[]
  columns: string[]
  visualizationType: 'table' | 'bar' | 'line' | 'pie' | 'map' | 'metric'
  executionTime?: number
  cached?: boolean
}

export function QueryResult({
  sql,
  explanation,
  data,
  columns,
  visualizationType,
  executionTime,
  cached
}: QueryResultProps) {
  // Prepare data for charts
  const prepareChartData = () => {
    if (!data || data.length === 0) return []

    // For metric visualization, return single value
    if (visualizationType === 'metric' && data.length === 1) {
      const firstRow = data[0]
      const numericKeys = columns.filter(col => typeof firstRow[col] === 'number')
      if (numericKeys.length > 0) {
        return [{ name: numericKeys[0], value: firstRow[numericKeys[0]] }]
      }
    }

    // For bar/line charts, use first two columns (category + value)
    if ((visualizationType === 'bar' || visualizationType === 'line') && columns.length >= 2) {
      return data.map(row => ({
        name: String(row[columns[0]] || ''),
        value: Number(row[columns[1]] || 0),
        [columns[1]]: Number(row[columns[1]] || 0)
      }))
    }

    // For pie charts, use first two columns
    if (visualizationType === 'pie' && columns.length >= 2) {
      return data.map(row => ({
        name: String(row[columns[0]] || ''),
        value: Number(row[columns[1]] || 0)
      }))
    }

    // Default: return data as-is
    return data
  }

  const chartData = prepareChartData()

  // Get icon for visualization type
  const getVisualizationIcon = () => {
    switch (visualizationType) {
      case 'bar':
        return <BarChart3 className="h-4 w-4" />
      case 'line':
        return <TrendingUp className="h-4 w-4" />
      case 'pie':
        return <PieChart className="h-4 w-4" />
      case 'map':
        return <Map className="h-4 w-4" />
      case 'metric':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Table2 className="h-4 w-4" />
    }
  }

  // Format metric display
  const renderMetric = () => {
    if (data.length === 0) return null

    const firstRow = data[0]
    const numericKeys = columns.filter(col => typeof firstRow[col] === 'number')
    const stringKeys = columns.filter(col => typeof firstRow[col] === 'string')

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {numericKeys.map(key => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof firstRow[key] === 'number' 
                  ? firstRow[key].toLocaleString('en-US', { maximumFractionDigits: 2 })
                  : firstRow[key]}
              </div>
            </CardContent>
          </Card>
        ))}
        {stringKeys.map(key => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{firstRow[key]}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Result
            {cached && <Badge variant="secondary" className="text-xs">Cached</Badge>}
            {executionTime && (
              <Badge variant="outline" className="text-xs">
                {executionTime}ms
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{explanation}</p>
        </CardContent>
      </Card>

      {/* Visualization */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getVisualizationIcon()}
              {visualizationType === 'metric' ? 'Metrics' : 'Visualization'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visualizationType === 'metric' ? (
              renderMetric()
            ) : visualizationType === 'table' ? (
              <ScrollArea className="h-[400px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map(col => (
                        <TableHead key={col}>
                          {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 100).map((row, idx) => (
                      <TableRow key={idx}>
                        {columns.map(col => (
                          <TableCell key={col}>
                            {typeof row[col] === 'number'
                              ? row[col].toLocaleString('en-US', { maximumFractionDigits: 2 })
                              : String(row[col] || '-')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {data.length > 100 && (
                  <div className="text-sm text-muted-foreground p-4 text-center">
                    Showing first 100 of {data.length} rows
                  </div>
                )}
              </ScrollArea>
            ) : (
              <div className="h-[400px]">
                <Chart
                  title=""
                  data={chartData}
                  type={visualizationType === 'line' ? 'line' : visualizationType === 'pie' ? 'pie' : 'bar'}
                  dataKey="value"
                  height={400}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SQL Query */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Code className="h-4 w-4" />
            Generated SQL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sql">
            <TabsList>
              <TabsTrigger value="sql">SQL</TabsTrigger>
              <TabsTrigger value="data">Raw Data</TabsTrigger>
            </TabsList>
            <TabsContent value="sql" className="mt-4">
              <ScrollArea className="h-[200px] w-full">
                <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{sql}</code>
                </pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="data" className="mt-4">
              <ScrollArea className="h-[200px] w-full">
                <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{JSON.stringify(data.slice(0, 10), null, 2)}</code>
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

