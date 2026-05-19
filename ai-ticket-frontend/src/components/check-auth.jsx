import { Link, useNavigate, Navigate } from "react-router-dom";

export default function CheckAuth({ children, protected: isProtected }) {
  const token = localStorage.getItem("token");
  let user = localStorage.getItem("user");

  if (user) {
    user = JSON.parse(user);
  }

  // --- THE BOUNCER LOGIC ---
  // If the page is protected and there is no token, redirect to login
  if (isProtected && !token) {
    return <Navigate to="/login" replace />;
  }

  // If the page is public (like login/signup) and they ARE logged in, redirect to the dashboard
  if (!isProtected && token) {
    return <Navigate to="/" replace />;
  }
  // -------------------------

  const navigate = useNavigate();

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <>
      <div className="sticky top-0 z-50 backdrop-blur-md bg-base-100/80 border-b border-base-200">
        <div className="navbar max-w-6xl mx-auto">
          <div className="flex-1">
            <Link to="/" className="btn btn-ghost text-xl font-bold tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-primary-content shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="bg-gradient-to-r from-base-content to-base-content/70 bg-clip-text text-transparent">TicketAI System</span>
            </Link>
          </div>
          <div className="flex gap-3 items-center">
            {!token ? (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm font-medium">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm rounded-full px-5 shadow-sm">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1 bg-base-200/50 rounded-full border border-base-300">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <p className="text-xs font-medium text-base-content/80">{user?.email}</p>
                </div>
                {user?.role === "admin" ? (
                  <Link to="/admin" className="btn btn-outline btn-sm rounded-full border-base-300 hover:border-primary">
                    Dashboard
                  </Link>
                ) : null}
                <button onClick={logout} className="btn btn-ghost btn-sm rounded-full text-base-content/70 hover:text-error hover:bg-error/10">
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* This is where your nested pages will actually render! */}
      <main>
        {children}
      </main>
    </>
  );
}