import type { DailyMetric } from "../lib/adminMetrics";

function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const midX = (previous.x + point.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export function DailySalesChart({ data, revenueLabel, ordersLabel, title, noData }: { data: DailyMetric[]; revenueLabel: string; ordersLabel: string; title: string; noData: string }) {
  const width = Math.min(12_000, Math.max(760, data.length * 12));
  const height = 250;
  const pad = { top: 24, right: 42, bottom: 42, left: 42 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const maxRevenue = data.reduce((max, item) => Math.max(max, item.revenue), 100);
  const maxOrders = data.reduce((max, item) => Math.max(max, item.orders), 1);
  const xFor = (index: number) => pad.left + (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const yRevenue = (value: number) => pad.top + plotHeight - (value / maxRevenue) * plotHeight;
  const yOrders = (value: number) => pad.top + plotHeight - (value / maxOrders) * plotHeight;
  const revenuePoints = data.map((item, index) => ({ x: xFor(index), y: yRevenue(item.revenue) }));
  const orderPoints = data.map((item, index) => ({ x: xFor(index), y: yOrders(item.orders) }));
  const revenueColor = (value: number) => value < 100 ? "#ef4444" : value <= 300 ? "#d97706" : "#059669";
  const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />{revenueLabel}</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-4 border-t-2 border-dashed border-sky-500" />{ordersLabel}</span>
        </div>
      </div>
      {data.length > 0 && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{dateLabel(data[0].date)} – {dateLabel(data[data.length - 1].date)}</p>}
      {data.length === 0 ? <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">{noData}</p> : (
        <div tabIndex={0} role="group" aria-label={title} className="mt-4 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} style={{ minWidth: width }} className="w-full overflow-visible">
            {[0, 0.5, 1].map((ratio) => {
              const y = pad.top + plotHeight * ratio;
              return <line key={ratio} x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeDasharray="3 6" />;
            })}
            <path d={smoothPath(orderPoints)} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" />
            <path d={smoothPath(revenuePoints)} fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
            {data.map((item, index) => (
              <g key={item.date}>
                <circle cx={revenuePoints[index].x} cy={revenuePoints[index].y} r="5" fill={revenueColor(item.revenue)} stroke="white" strokeWidth="2" className="dark:stroke-slate-900" />
                <circle cx={orderPoints[index].x} cy={orderPoints[index].y} r="3.5" fill="#0ea5e9" stroke="white" strokeWidth="2" className="dark:stroke-slate-900" />
                <title>{`${dateLabel(item.date)}: EUR ${item.revenue.toFixed(2)}, ${item.orders} ${ordersLabel}`}</title>
                {(index === 0 || index === data.length - 1 || index % Math.max(1, Math.ceil(data.length / Math.max(6, Math.floor(width / 130)))) === 0) && <text x={xFor(index)} y={height - 14} textAnchor="middle" className="fill-slate-400 text-[11px]">{dateLabel(item.date)}</text>}
              </g>
            ))}
            <text x="8" y={pad.top + 4} className="fill-slate-400 text-[10px]">EUR {Math.round(maxRevenue)}</text>
            <text x="14" y={pad.top + plotHeight + 4} className="fill-slate-400 text-[10px]">EUR 0</text>
            <text x={width - 6} y={pad.top + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{maxOrders}</text>
            <text x={width - 6} y={pad.top + plotHeight + 4} textAnchor="end" className="fill-slate-400 text-[10px]">0</text>
          </svg>
        </div>
      )}
    </section>
  );
}
