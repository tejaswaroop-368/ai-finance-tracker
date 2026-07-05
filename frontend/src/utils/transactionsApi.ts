const API_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

export const fetchTransactions = async () => {
  const response = await fetch(`${API_URL}/api/transactions`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to load transactions');
  }

  return response.json();
};

export const createTransaction = async (transaction: {
  date: string;
  description: string;
  category: string;
  account: string;
  type: string;
  amount: number;
}) => {
  const response = await fetch(`${API_URL}/api/transactions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create transaction');
  }

  return response.json();
};

export const updateTransaction = async (id: string, transaction: {
  date?: string;
  description?: string;
  category?: string;
  account?: string;
  type?: string;
  amount?: number;
}) => {
  const response = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update transaction');
  }

  return response.json();
};

export const deleteTransaction = async (id: string) => {
  const response = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete transaction');
  }

  return response.json();
};
