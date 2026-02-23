import React from "react";

interface DataTableProps {
  data: any[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (!data.length) return null;
  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto bg-gray-800 p-4 rounded-xl mt-8">
      <table className="min-w-full border-collapse border border-gray-700 text-sm text-gray-200">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="border border-gray-700 p-2 bg-gray-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((row, i) => (
            <tr key={i}>
              {headers.map((h) => (
                <td key={h} className="border border-gray-700 p-2 text-center">
                  {row[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
