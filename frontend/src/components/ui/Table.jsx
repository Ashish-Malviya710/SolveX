import React from "react";

/**
 * ClickHouse Flat Data Table Component
 */
export const Table = ({ children, className = "" }) => {
  return (
    <div className={`table-container ${className}`}>
      <table className="w-full text-left border-collapse">
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className = "" }) => {
  return (
    <thead className={`table-header ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = "" }) => {
  return (
    <tbody className={`divide-y divide-iron/40 ${className}`}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className = "", onClick }) => {
  return (
    <tr
      onClick={onClick}
      className={`table-row ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className = "" }) => {
  return (
    <th className={`px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-smoke ${className}`}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = "" }) => {
  return (
    <td className={`table-cell ${className}`}>
      {children}
    </td>
  );
};

export default Table;
