import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthContext } from '../../context/AuthContext';
import type { User } from '@shared/schemas';

type AuthValue = {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  login: () => Promise<User>;
  register: () => Promise<User>;
  logout: () => Promise<void>;
};

function renderWithAuth(user: User | null, isLoading = false, initialPath = '/protected') {
  const value: AuthValue = {
    user,
    isLoading,
    token: user ? 'tok' : null,
    login: async () => user!,
    register: async () => user!,
    logout: async () => {},
  };

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    const user: User = { id: 1, email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'student', isBanned: false, createdAt: new Date().toISOString() };
    renderWithAuth(user);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    renderWithAuth(null);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading indicator while auth state is resolving', () => {
    renderWithAuth(null, true);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
