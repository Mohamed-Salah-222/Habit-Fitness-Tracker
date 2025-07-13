// src/App.jsx
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Import the components we have already created
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import VerifyPage from "./components/VerifyPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Add simple placeholders for pages we will build next
const DashboardPage = () => <h1 className="text-2xl font-bold">My Habits Dashboard</h1>;
const AddHabitPage = () => <h1 className="text-2xl font-bold">Add a New Habit</h1>;

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <nav className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                HabitFlow
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                // If user IS logged in
                <>
                  <span className="text-sm text-gray-700 hidden sm:block">
                    Hello, <span className="font-bold">{user.username}</span>
                  </span>
                  <Link to="/habits/new" className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    New Habit
                  </Link>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium">
                    Logout
                  </button>
                </>
              ) : (
                // If user is NOT logged in
                <>
                  <Link to="/register" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Register
                  </Link>
                  <Link to="/login" className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/habits/new"
            element={
              <ProtectedRoute>
                <AddHabitPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
