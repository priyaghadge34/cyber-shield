"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

interface AttackChartProps {
  data: any[];
}

const AttackChart: React.FC<AttackChartProps> = ({ data }) => {
  if (!data.length) return null;

  // Count crimes by label (or category)
  const counts: Record<string, number> = {};
  data.forEach((row) => {
    const label = row.Label || "Unknown";
    counts[label] = (counts[label] || 0) + 1;
  });

  const chartData = Object.keys(counts).map((label) => ({
    name: label,
    value: counts[label],
  }));

  return (
    <div className="bg-gray-800 rounded-xl shadow-md p-4 mt-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-300">Incidents by Label</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Bar dataKey="value" fill="#38bdf8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttackChart;
