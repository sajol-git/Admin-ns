export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[50vh]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500 animate-pulse">Loading data...</p>
      </div>
    </div>
  );
}
