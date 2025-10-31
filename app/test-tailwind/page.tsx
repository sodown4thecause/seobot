export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          🎨 Tailwind CSS is Working!
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-purple-600 rounded-lg mb-4"></div>
            <h3 className="font-semibold text-lg mb-2">Purple</h3>
            <p className="text-gray-600 text-sm">Custom purple colors work</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-lg shadow-lg text-white">
            <div className="w-12 h-12 bg-white/20 rounded-lg mb-4"></div>
            <h3 className="font-semibold text-lg mb-2">Gradient</h3>
            <p className="text-white/90 text-sm">Gradients are working</p>
          </div>
          
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-600 rounded-lg mb-4"></div>
            <h3 className="font-semibold text-lg mb-2">Hover Effects</h3>
            <p className="text-gray-600 text-sm">Hover me!</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">Utilities Test</h2>
          <div className="space-y-3">
            <p className="text-gray-700">✓ Typography classes working</p>
            <p className="text-sm text-gray-500">✓ Text sizing working</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-medium">✓ Flexbox working</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="h-8 bg-red-500 rounded"></div>
              <div className="h-8 bg-yellow-500 rounded"></div>
              <div className="h-8 bg-green-500 rounded"></div>
              <div className="h-8 bg-blue-500 rounded"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg">
            Primary Button
          </button>
          <button className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors">
            Secondary Button
          </button>
        </div>
      </div>
    </div>
  )
}
