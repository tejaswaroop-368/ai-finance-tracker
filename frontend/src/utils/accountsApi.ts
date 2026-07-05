const API_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

export const fetchAccounts = async () => {
  const response = await fetch(`${API_URL}/api/accounts`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to load accounts');
  }
  return response.json();
};

export const createAccount = async (account: { name: string; type: string; balance: number }) => {
  const response = await fetch(`${API_URL}/api/accounts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(account),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create account');
  }
  return response.json();
};

export const updateAccount = async (id: string, account: { name: string; type: string; balance: number }) => {
  const response = await fetch(`${API_URL}/api/accounts/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(account),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update account');
  }
  return response.json();
};

export const deleteAccount = async (id: string) => {
  const response = await fetch(`${API_URL}/api/accounts/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete account');
  }
  return response.json();
};
