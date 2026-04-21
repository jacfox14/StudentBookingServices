import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup';
import { AuthProvider } from '../../../context/AuthContext';
import Login from '../Login';
import { clearToken } from '../../../api/axios';

afterEach(() => clearToken());

function renderLogin(initialPath = '/login') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Student Dashboard</div>} />
          <Route path="/provider/dashboard" element={<div>Provider Dashboard</div>} />
          <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login page', () => {
  it('shows inline error for invalid email format (client-side Zod)', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'notanemail');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument());
  });

  it('redirects to the role dashboard after successful login', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'alex@wsu.edu');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Student Dashboard')).toBeInTheDocument());
  });

  it('shows top-level error message on bad credentials (401)', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ code: 'UNAUTHENTICATED', message: 'Invalid email or password' }, { status: 401 })
      )
    );

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'alex@wsu.edu');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // ErrorSummary renders the top-level message
    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    );
  });

  it('maps server-returned fieldErrors to inline field errors', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', message: 'Bad input', fieldErrors: { email: 'Check your email' } },
          { status: 400 }
        )
      )
    );

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'alex@wsu.edu');
    // Must satisfy min-8 chars so client-side validation passes and onSubmit fires
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
  });

  it('form fields have accessible labels', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
