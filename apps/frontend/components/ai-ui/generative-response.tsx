"use client";

import type { HTMLAttributes } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type UIComponentType = "card" | "table" | "chart" | "list";

export interface UIResponse {
  type: "ui_response";
  title: string;
  summary: string;
  components: Array<{
    component: UIComponentType;
    props: Record<string, unknown>;
  }>;
}

interface CardItem {
  label: string;
  value: string;
  trend?: string;
}

interface UICardProps extends HTMLAttributes<HTMLDivElement> {
  items: CardItem[];
}

interface UITableProps extends HTMLAttributes<HTMLDivElement> {
  headers: string[];
  rows: string[][];
}

interface UIChartProps extends HTMLAttributes<HTMLDivElement> {
  type: "bar" | "line" | "pie";
  data: Array<{ label: string; value: number }>;
}

interface UIListProps extends HTMLAttributes<HTMLElement> {
  items: string[];
  numbered?: boolean;
}

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
] as const;

function isValidTrend(trend: string): boolean {
  return /^[+-]?\d+(\.\d+)?%$/.test(trend);
}

function TrendIndicator({ trend }: { trend: string }) {
  if (!isValidTrend(trend)) {
    return null;
  }

  const isPositive = trend.startsWith("+");
  const isNeutral = trend.startsWith("±") || trend === "0%";

  return (
    <span
      className={cn(
        "ml-2 text-xs font-medium",
        isPositive ? "text-emerald-600" : undefined,
        isNeutral ? "text-muted-foreground" : undefined,
        !isPositive && !isNeutral ? "text-rose-600" : undefined
      )}
    >
      {trend}
    </span>
  );
}

export function UICard({ items, className, ...props }: UICardProps) {
  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const key = `${item.label}-${item.value}`;
            return (
              <div className="flex flex-col gap-1" key={key}>
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <div className="flex items-baseline">
                  <span className="text-2xl font-semibold">{item.value}</span>
                  {item.trend && <TrendIndicator trend={item.trend} />}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function UITable({ headers, rows, className, ...props }: UITableProps) {
  return (
    <div
      className={cn("w-full overflow-auto rounded-md border", className)}
      {...props}
    >
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            {headers.map((header, idx) => {
              const key = `header-${idx}`;
              return (
                <th
                  className="h-12 px-4 text-left font-medium text-muted-foreground"
                  key={key}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            const key = `row-${rowIdx}`;
            return (
              <tr
                className="border-b transition-colors hover:bg-muted/50"
                key={key}
              >
                {row.map((cell, cellIdx) => {
                  const cellKey = `cell-${rowIdx}-${cellIdx}`;
                  return (
                    <td className="p-4" key={cellKey}>
                      {cell}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function UIChart({ type, data, className, ...props }: UIChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (type === "pie") {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let cumulativePercent = 0;

    return (
      <div
        className={cn("flex items-center justify-center gap-8", className)}
        {...props}
      >
        <div className="relative size-40">
          <svg className="size-full -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percent = item.value / total;
              const startAngle = cumulativePercent * 360;
              const endAngle = (cumulativePercent + percent) * 360;
              cumulativePercent += percent;

              const startX = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
              const startY = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
              const endX = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
              const endY = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);

              const largeArcFlag = percent > 0.5 ? 1 : 0;
              const key = `pie-${index}`;

              return (
                <path
                  className="transition-opacity hover:opacity-80"
                  d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  key={key}
                />
              );
            })}
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          {data.map((item, index) => {
            const key = `legend-${index}`;
            return (
              <div className="flex items-center gap-2" key={key}>
                <div
                  className="size-3 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="text-sm">
                  {item.label}: {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="flex h-48 items-end gap-2">
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100;
          const key = `bar-${index}`;

          return (
            <div
              className="group relative flex flex-1 flex-col items-center gap-2"
              key={key}
            >
              <span className="absolute -top-6 opacity-0 transition-opacity group-hover:opacity-100 text-xs">
                {item.value}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-md transition-all group-hover:opacity-80",
                  type === "bar"
                    ? "bg-primary"
                    : "bg-transparent border-l-2 border-primary"
                )}
                style={{
                  height: `${heightPercent}%`,
                  minHeight: type === "line" ? "2px" : "4px",
                }}
              />
              <span className="text-xs text-muted-foreground truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function UIList({
  items,
  numbered = false,
  className,
  ...props
}: UIListProps) {
  const ListTag = numbered ? "ol" : "ul";
  const listProps = props as React.HTMLAttributes<HTMLElement>;

  return (
    <ListTag
      className={cn(
        "my-2 ml-6 list-outside",
        numbered ? "list-decimal" : "list-disc",
        "space-y-1",
        className
      )}
      {...listProps}
    >
      {items.map((item, index) => {
        const key = `item-${index}`;
        return (
          <li className="text-sm" key={key}>
            {item}
          </li>
        );
      })}
    </ListTag>
  );
}

interface GenerativeResponseProps {
  response: UIResponse;
  className?: string;
}

export function GenerativeResponse({
  response,
  className,
}: GenerativeResponseProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {response.title && (
        <h3 className="text-lg font-semibold">{response.title}</h3>
      )}
      {response.summary && (
        <p className="text-sm text-muted-foreground">{response.summary}</p>
      )}
      {response.components.map((component, index) => {
        const key = `comp-${index}`;
        switch (component.component) {
          case "card":
            return <UICard key={key} {...(component.props as UICardProps)} />;
          case "table":
            return <UITable key={key} {...(component.props as UITableProps)} />;
          case "chart":
            return <UIChart key={key} {...(component.props as UIChartProps)} />;
          case "list":
            return <UIList key={key} {...(component.props as UIListProps)} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export function parseUIResponse(text: string): UIResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.type !== "ui_response") {
      return null;
    }

    if (
      typeof parsed.title !== "string" ||
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.components)
    ) {
      return null;
    }

    return parsed as UIResponse;
  } catch {
    return null;
  }
}
