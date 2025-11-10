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
        return <BarChart3 className="h-3 w-3" />
      case 'line':
        return <TrendingUp className="h-3 w-3" />
      case 'pie':
        return <PieChart className="h-3 w-3" />
      case 'map':
        return <Map className="h-3 w-3" />
      case 'metric':
        return <TrendingUp className="h-3 w-3" />
      default:
        return <Table2 className="h-3 w-3" />
    }
  }

  // Get first row for metric display
  const firstRow = data.length > 0 ? data[0] : null
  const numericKeys = firstRow ? columns.filter(col => typeof firstRow[col] === 'number') : []
  const stringKeys = firstRow ? columns.filter(col => typeof firstRow[col] === 'string') : []

  return (
    <div className="space-y-3">
      {/* Explanation */}
      <Card>
        <CardHeader className="pb-2 p-3">
          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
            <Database className="h-3 w-3" />
            Result
            {cached && <Badge variant="secondary" className="text-[10px] px-1 py-0">Cached</Badge>}
            {executionTime && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {executionTime}ms
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
        </CardContent>
      </Card>

      {/* Visualization */}
      {data.length > 0 && (
        <Card>
          <CardHeader className="pb-2 p-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              {getVisualizationIcon()}
              {visualizationType === 'metric' ? 'Metrics' : 'Visualization'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {visualizationType === 'metric' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {numericKeys.map(key => (
                  <Card key={key} className="p-2">
                    <CardHeader className="pb-1 p-0">
                      <CardTitle className="text-[10px] font-medium text-muted-foreground">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pt-1">
                      <div className="text-lg font-bold">
                        {typeof firstRow[key] === 'number' 
                          ? firstRow[key].toLocaleString('en-US', { maximumFractionDigits: 2 })
                          : firstRow[key]}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {stringKeys.map(key => (
                  <Card key={key} className="p-2">
                    <CardHeader className="pb-1 p-0">
                      <CardTitle className="text-[10px] font-medium text-muted-foreground">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pt-1">
                      <div className="text-sm font-semibold">{firstRow[key]}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : visualizationType === 'table' ? (
              <ScrollArea className="h-[300px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map(col => (
                        <TableHead key={col} className="text-xs h-8">
                          {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 100).map((row, idx) => (
                      <TableRow key={idx}>
                        {columns.map(col => (
                          <TableCell key={col} className="text-xs py-1.5">
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
                  <div className="text-xs text-muted-foreground p-3 text-center">
                    Showing first 100 of {data.length} rows
                  </div>
                )}
              </ScrollArea>
            ) : (
              <div className="h-[300px]">
                <Chart
                  title=""
                  data={chartData}
                  type={visualizationType === 'line' ? 'line' : visualizationType === 'pie' ? 'pie' : 'bar'}
                  dataKey="value"
                  height={300}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SQL Query */}
      <Card>
        <CardHeader className="pb-2 p-3">
          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
            <Code className="h-3 w-3" />
            Generated SQL
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <Tabs defaultValue="sql" className="w-full">
            <TabsList className="h-7 text-xs">
              <TabsTrigger value="sql" className="text-xs px-2">SQL</TabsTrigger>
              <TabsTrigger value="data" className="text-xs px-2">Raw Data</TabsTrigger>
            </TabsList>
            <TabsContent value="sql" className="mt-2">
              <ScrollArea className="h-[150px] w-full">
                <pre className="text-[10px] bg-muted p-3 rounded-md overflow-x-auto leading-relaxed">
                  <code>{sql}</code>
                </pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="data" className="mt-2">
              <ScrollArea className="h-[150px] w-full">
                <pre className="text-[10px] bg-muted p-3 rounded-md overflow-x-auto leading-relaxed">
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

