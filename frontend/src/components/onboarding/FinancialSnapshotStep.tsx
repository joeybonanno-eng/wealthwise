"use client";

interface FinancialSnapshotStepProps {
  income: string;
  expenses: string;
  savings: string;
  debt: string;
  onChange: (field: string, value: string) => void;
}

const fields = [
  { key: "income", label: "Annual Income", placeholder: "75,000" },
  { key: "expenses", label: "Monthly Expenses", placeholder: "3,000" },
  { key: "savings", label: "Total Savings", placeholder: "50,000" },
  { key: "debt", label: "Total Debt", placeholder: "10,000" },
];

export default function FinancialSnapshotStep({
  income,
  expenses,
  savings,
  debt,
  onChange,
}: FinancialSnapshotStepProps) {
  const values: Record<string, string> = { income, expenses, savings, debt };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Financial Snapshot</h2>
        <p className="mt-2 text-gray-400">
          These are optional but help us give better advice
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              {field.label}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={values[field.key]}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={field.placeholder}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-500">
        Your data is encrypted and never shared with third parties.
      </p>
    </div>
  );
}
