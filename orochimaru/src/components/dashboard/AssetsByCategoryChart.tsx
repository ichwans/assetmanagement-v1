import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
import { useQuery } from '@tanstack/react-query';
import { getAssetsByCategory } from '@/lib/api/dashboard';

type DataItem = { name: string; value: number; slug: string };

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function AssetsByCategoryChart() {
  const { data: resp } = useQuery({ queryKey: ['dashboard','assets-by-category'], queryFn: getAssetsByCategory });
  const data: DataItem[] = (resp?.data ?? []).map((c) => ({ name: c.name, value: c.count, slug: c.slug }));

  const total = data.reduce((s, d) => s + d.value, 0);

  const config = Object.fromEntries(
    data.map((d, i) => [d.slug, { label: d.name, color: COLORS[i % COLORS.length] }])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset per Kategori</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart data={data} barSize={24}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
            <Bar dataKey="value" fill={COLORS[0]} radius={[4,4,0,0]} />
          </BarChart>
        </ChartContainer>
        <p className="text-sm text-muted-foreground mt-4">Total: {total} asset</p>
      </CardContent>
    </Card>
  );
}
