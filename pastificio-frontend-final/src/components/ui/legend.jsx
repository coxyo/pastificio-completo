// components/ui/legend.jsx
export function Legend({ items = [] }) {
  if (items.length === 0) return null;
  
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex items-center justify-between w-full">
            <span className="text-sm">{item.label}</span>
            {item.value && (
              <span className="text-sm font-medium">{item.value}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}