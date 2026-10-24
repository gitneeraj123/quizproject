import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { registerUser } from '../authSlice';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', organization: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Registering also signs the teacher in, so go straight to the dashboard
      await dispatch(registerUser(formData)).unwrap();
      navigate('/dashboard');
    } catch (message) {
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-lg shadow-card p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-primary">Create an account</h1>
          <p className="text-sm text-gray-500 mt-2">Join to start creating assessments.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Full Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Organization</label>
            <input type="text" required value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary" placeholder="Hogwarts or Google" />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary" placeholder="jane@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Password</label>
            <input type="password" required minLength={8} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary" placeholder="••••••••" />
          </div>

          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md">{error}</div>}

          <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-medium py-2 px-4 rounded-md hover:bg-gray-800 mt-4">
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}