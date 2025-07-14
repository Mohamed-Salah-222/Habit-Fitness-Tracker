import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth(); // Get the token for API calls

  // Function to fetch the user's habits from the backend
  const fetchHabits = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/habits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch habits.");
      }
      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error("Error fetching habits:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect to fetch habits when the component first loads
  useEffect(() => {
    fetchHabits();
  }, [token]); // Re-fetch if the token changes (e.g., on login)

  // Function to handle marking a habit as complete
  const handleCompleteHabit = async (habitId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/habits/${habitId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete habit.");
      }

      // To update the UI, we simply re-fetch the habits list
      // to get the latest completion data.
      fetchHabits();
    } catch (error) {
      console.error("Error completing habit:", error);
      alert(error.message); // Show an alert to the user
    }
  };

  // Helper function to check if a habit was completed today
  const isCompletedToday = (completions) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return completions.some((dateStr) => {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  };

  if (loading) {
    return <div className="text-center p-10">Loading your habits...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Habits Dashboard</h1>
      <div className="space-y-4">
        {habits.length > 0 ? (
          habits.map((habit) => {
            const completed = isCompletedToday(habit.completions);
            return (
              <div key={habit._id} className={`p-4 rounded-lg shadow flex items-center justify-between transition-colors ${completed ? "bg-green-100" : "bg-white"}`}>
                <span className={`text-lg ${completed ? "line-through text-gray-500" : "text-gray-800"}`}>{habit.name}</span>
                <button onClick={() => handleCompleteHabit(habit._id)} disabled={completed} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${completed ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}>
                  {completed ? "Done!" : "Complete"}
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 mt-8">You haven't added any habits yet. Click "New Habit" to get started!</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
