import { useAuthStore } from '../store';
import AdminLogin from './AdminLogin';

export default function AdminRoute({ children }) {
  const { user, token } = useAuthStore();
  const isAdmin = Boolean(user && token && (user.isAdmin || user.role === 'admin'));

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return children;
}
