'use client'

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

export interface GrowthPoint { day: string; signups: number }
export interface RolePoint { role: string; total: number }

const ROLE_COLOURS: Record<string, string> = {
  member: '#6b665e',
  moderator: '#1a48fe',
  admin: '#2D7FF9',
  super_admin: '#f0f0f0',
}

export function UserGrowthChart({ data }: { data: GrowthPoint[] }) {
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: -12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="day" stroke="var(--text3)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis stroke="var(--text3)" tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--card-glass)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              color: 'var(--text1)',
            }}
            cursor={{ stroke: 'var(--blue)', strokeOpacity: 0.2 }}
          />
          <Line
            type="monotone"
            dataKey="signups"
            stroke="var(--blue)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--blue)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RoleDonutChart({ data }: { data: RolePoint[] }) {
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="role"
            innerRadius={56}
            outerRadius={90}
            paddingAngle={2}
            stroke="var(--bg)"
          >
            {data.map((d) => (
              <Cell key={d.role} fill={ROLE_COLOURS[d.role] ?? '#888'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--card-glass)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              color: 'var(--text1)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={32}
            wrapperStyle={{ fontSize: 12, color: 'var(--text2)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
