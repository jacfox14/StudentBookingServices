import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RoleRoute from '../RoleRoute';
import { AuthContext } from '../../context/AuthContext';
import type { User } from '@shared/schemas';

type AuthValue = Parameters<typeof AuthContext.Provider>[0]['value'];

function makeUser(role: 'student' | 'staff' | 'admin'): User {
  return { id: 1, email: 'a@b.com', firstName: 'A', lastName: 'B', role, isBanned: false, createdAt: new Date().toISOString() };
}

function renderWithRole(user: User | null, allowedRoles: ('student' | 'staff' | 'admin')[]) {
  const value: AuthValue = {
    user,
    isLoading: false,
    token: user ? 'tok' : null,
    login: async () => user!,
    register: async () => user!,
    logout: async () => {},
  };

  return render(
    <MemoryRouter initialEntries={['/guarded']}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route element={<RoleRoute roles={allowedRoles} />}>
            <Route path="/guarded" element={<div>Guarded Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/403" element={<div>Forbidden Page</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('RoleRoute', () => {
  it('renders children when user role matches', () => {
    renderWithRole(makeUser('admin'), ['staff', 'admin']);
    expect(screen.getByText('Guarded Content')).toBeInTheDocument();
  });

  it('redirects to /403 when user role is not in the allowed list', () => {
    renderWithRole(makeUser('student'), ['admin']);
    expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
    expect(screen.queryByText('Guarded Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when there is no user', () => {
    renderWithRole(null, ['student']);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
