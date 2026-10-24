import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, restoreSession } from './features/auth/authSlice';

// --- COMPONENTS ---
import Login from './features/auth/components/Login';
import Register from './features/auth/components/Register';
import Overview from './features/dashboard/Overview';
import QuizInit from './features/quizzes/components/QuizInit';
import Sessions from './features/dashboard/Sessions';
import ReportDetail from './features/dashboard/ReportDetail';

// The new student exam view we built!
import TakeQuiz from './features/exam/TakeQuiz'; 

// --- ROUTE PROTECTION ---
// Since we removed student accounts, anyone who logs in is a Teacher/Admin.
// The access token is only in memory, so after a page reload we first ask the
// server (via the refresh cookie) whether the teacher is still signed in.
const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, sessionStatus } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) dispatch(restoreSession());
  }, [dispatch, isAuthenticated]);

  if (isAuthenticated) return children;
  if (sessionStatus !== 'done') return <div className="p-8 text-gray-500">Loading...</div>;
  return <Navigate to="/login" replace />;
};

// --- LAYOUT ---
const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-pink-600">QuizPlatform</h2>
          <p className="text-xs text-gray-500 mt-1">{user?.organization || 'Workspace'}</p>
          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs font-semibold rounded uppercase tracking-wide text-gray-600">
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Teacher'}
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 text-sm font-medium text-gray-600">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 px-3">Menu</div>
          <Link to="/dashboard" className="block px-3 py-2 rounded-md hover:bg-gray-50 hover:text-pink-600">Home</Link>
          <Link to="/dashboard/create-quiz" className="block px-3 py-2 rounded-md hover:bg-gray-50 hover:text-pink-600">Create Assessment</Link>
          <Link to="/dashboard/sessions" className="block px-3 py-2 rounded-md hover:bg-gray-50 hover:text-pink-600 flex items-center gap-2">
             Sessions & Reports
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-sm font-medium text-gray-900 mb-3">{user?.name || 'Educator'}</p>
          <button onClick={() => dispatch(logoutUser())} className="text-sm text-red-600 hover:underline font-bold">Log out</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto bg-[#F8F9FA]">
        {children}
      </main>
    </div>
  );
};

// --- APP ROUTER ---
export default function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* PUBLIC STUDENT ROUTE (No Sidebar, Full Screen) */}
        {/* Notice it expects the exact :id parameter we set up in TakeQuiz.jsx */}
        <Route path="/take-quiz/:id" element={<TakeQuiz />} />
        
        {/* PROTECTED TEACHER ROUTES */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardLayout><Overview /></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/create-quiz" element={
          <ProtectedRoute><DashboardLayout><QuizInit /></DashboardLayout></ProtectedRoute>
        } />
        <Route path="/dashboard/sessions" element={
          <ProtectedRoute><DashboardLayout><Sessions /></DashboardLayout></ProtectedRoute>
        } />
        {/* 🔥 THE FIX: Changed :sessionId to :quizId so ReportDetail can read it! */}
        <Route path="/dashboard/sessions/:quizId" element={
          <ProtectedRoute><DashboardLayout><ReportDetail /></DashboardLayout></ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
