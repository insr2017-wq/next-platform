import * as React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart 
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfitEvolutionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfit: string;
}

const MOCK_DATA = {
  '7d': [
    { day: '05/08', value: 650 },
    { day: '06/08', value: 670 },
    { day: '07/08', value: 685 },
    { day: '08/08', value: 710 },
    { day: '09/08', value: 725 },
    { day: '10/08', value: 740 },
    { day: '11/08', value: 750 },
  ],
  '30d': [
    { day: '12/07', value: 400 },
    { day: '19/07', value: 480 },
    { day: '26/07', value: 550 },
    { day: '02/08', value: 620 },
    { day: '09/08', value: 720 },
    { day: '11/08', value: 750 },
  ],
  '90d': [
    { day: 'Maio', value: 150 },
    { day: 'Junho', value: 380 },
    { day: 'Julho', value: 610 },
    { day: 'Agosto', value: 750 },
  ]
};

export function ProfitEvolutionModal({ isOpen, onOpenChange, currentProfit }: ProfitEvolutionModalProps) {
  const [period, setPeriod] = React.useState<'7d' | '30d' | '90d'>('7d');
  
  const data = MOCK_DATA[period];
  
  const firstVal = data[0]?.value ?? 0;
  const lastVal = data[data.length - 1]?.value ?? 0;
  const totalInPeriod = lastVal - firstVal;
  const growthPercent = firstVal !== 0 ? ((totalInPeriod / firstVal) * 100).toFixed(1) : "0";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[400px] bg-surface border-border rounded-3xl p-0 overflow-hidden outline-none">
        <div className="p-6 space-y-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-primary italic">
              Evolução do Lucro
            </DialogTitle>
          </DialogHeader>

          {/* Period Selector */}
          <div className="flex p-1 bg-background border border-border rounded-xl">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all",
                  period === p 
                    ? "bg-primary text-black shadow-lg" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : '90 Dias'}
              </button>
            ))}
          </div>

          {/* Graph Container */}
          <div className="h-[200px] w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A3E635" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A3E635" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0D1117', 
                    border: '1px solid #A3E63530',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: '#A3E635' }}
                  labelStyle={{ color: '#666', marginBottom: '4px' }}
                  cursor={{ stroke: '#A3E635', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#A3E635" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-background border border-border rounded-2xl">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Lucro no Período</p>
              <p className="text-lg font-black text-primary italic leading-none">R$ {totalInPeriod.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-muted uppercase tracking-wider">Crescimento</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <p className="text-lg font-black text-primary italic leading-none">+{growthPercent}%</p>
              </div>
            </div>
          </div>
          
          <p className="text-[9px] text-center text-muted font-medium italic">
            * Dados baseados no histórico diário de rendimentos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
