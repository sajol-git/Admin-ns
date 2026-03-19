export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
