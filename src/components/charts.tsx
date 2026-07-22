"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

type Ponto = { nome: string; valor: number; cor?: string };

export function BarrasSimples({ dados }: { dados: Ponto[] }) {
  if (dados.every((d) => d.valor === 0))
    return <p className="py-12 text-center text-sm text-muted">Sem dados.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "var(--muted)" }} interval={0} height={40} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} width={36} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--foreground)",
          }}
        />
        <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
          {dados.map((d, i) => (
            <Cell key={i} fill={d.cor ?? "#2563eb"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
