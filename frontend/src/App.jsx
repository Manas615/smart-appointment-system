function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
        
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
          Smart Appointment System
        </h1>

        <p className="text-gray-600 mb-6">
          Book and manage appointments efficiently with real-time availability.
        </p>

        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200">
          Book Appointment
        </button>

      </div>
    </div>
  );
}

export default App;
