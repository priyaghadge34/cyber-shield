import React from "react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  color?: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, color }) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-md p-5 text-center border border-gray-700">
      <h2 className="text-lg font-semibold text-gray-300">{title}</h2>
      <p className={`text-2xl font-bold mt-2 ${color || "text-white"}`}>{value}</p>
    </div>
  );
};

export default MetricsCard;
