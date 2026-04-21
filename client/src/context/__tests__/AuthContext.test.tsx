import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';
import { AuthProvider, useAuth } from '../AuthContext';
import { clearToken, setToken } from '../../api/axios';
import { users, makeToken } from '../../mocks/fixtures';

afterEach(() => clearToken());

function AuthConsumer() {
  const { user, isLoading, login, logout } = useAuth();
  if (isLoading) return <div>Loading</div>;
  if (!user) return <button onClick={() => login({ email: 'alex@wsu.edu', password: 'password123' })}>Login</button>;
  return (
    <div>
      <span data-testid="role">{user.role}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  it('starts unauthenticated when no token is in storage', async () => {
    render(<AuthProvider><AuthConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.queryByText('Loading')).toBeNull());
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('login() sets user and role after successful auth', async () => {
    render(<AuthProvider><AuthConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.queryByText('Loading')).toBeNull());

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('role')).toBeInTheDocument());
    expect(screen.getByTestId('role').textContent).toBe('student');
  });

  it('logout() clears user and token', async () => {
    render(<AuthProvider><AuthConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.queryByText('Loading')).toBeNull());

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => screen.getByTestId('role'));

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument());
  });

  it('auto-restores session when valid token exists in localStorage', async () => {
    const student = users.find((u) => u.email === 'alex@wsu.edu')!;
    setToken(makeToken(student.id, student.role));

    // Mock /users/me to return the student
    server.use(
      http.get('/api/users/me', () => HttpResponse.json(student))
    );

    render(<AuthProvider><AuthConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.queryByText('Loading')).toBeNull());
    expect(screen.getByTestId('role').textContent).toBe('student');
  });

  it('clears token and shows login when sbs:logout event fires', async () => {
    const student = users.find((u) => u.email === 'alex@wsu.edu')!;
    setToken(makeToken(student.id, student.role));

    server.use(
      http.get('/api/users/me', () => HttpResponse.json(student))
    );

    render(<AuthProvider><AuthConsumer /></AuthProvider>);
    await waitFor(() => screen.getByTestId('role'));

    act(() => { window.dispatchEvent(new CustomEvent('sbs:logout')); });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument());
  });
});
