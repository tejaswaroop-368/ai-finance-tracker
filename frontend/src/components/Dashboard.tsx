import { useEffect, useState } from 'react';

interface ProfileData {
    email: string;
    createdAt?: string;
    updatedAt?: string;
}

interface Account {
    _id: string;
    name: string;
    type: string;
    balance: number;
}

interface Transaction {
    _id: string;
    date: string;
    description: string;
    category: string;
    account: string;
    type: string;
    amount: number;
}

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    });

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            setError('');

            try {
                const [profileRes, accountsRes, transactionsRes] = await Promise.all([
                    fetch(`${API_URL}/api/auth/me`, { headers: authHeaders() }),
                    fetch(`${API_URL}/api/accounts`, { headers: authHeaders() }),
                    fetch(`${API_URL}/api/transactions`, { headers: authHeaders() }),
                ]);

                if (!profileRes.ok) {
                    const errorBody = await profileRes.json().catch(() => ({}));
                    throw new Error(errorBody.message || 'Unable to load profile data.');
                }

                if (!accountsRes.ok) {
                    const errorBody = await accountsRes.json().catch(() => ({}));
                    throw new Error(errorBody.message || 'Unable to load accounts.');
                }

                if (!transactionsRes.ok) {
                    const errorBody = await transactionsRes.json().catch(() => ({}));
                    throw new Error(errorBody.message || 'Unable to load transactions.');
                }

                const profileData = await profileRes.json();
                const accountsData = await accountsRes.json();
                const transactionsData = await transactionsRes.json();

                setProfile(profileData);
                setAccounts(Array.isArray(accountsData) ? accountsData : []);
                setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
            } catch (fetchError) {
                const message = fetchError instanceof Error ? fetchError.message : 'Unable to load dashboard data.';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const totalIncome = transactions
        .filter((transaction) => transaction.type === 'Credit')
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const totalExpenses = transactions
        .filter((transaction) => transaction.type !== 'Credit')
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const netSavings = totalIncome - totalExpenses;

    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>{profile ? `Welcome back, ${profile.email}` : 'Welcome to your financial dashboard'}</p>
            </div>

            {isLoading && <p>Loading dashboard data...</p>}
            {error && <div className="ai-error-message">{error}</div>}

            {!isLoading && !error && (
                <>
                    <div className="summary-panel">
                        <div className="summary-item">
                            <span className="summary-title">Total Balance</span>
                            <strong>${totalBalance.toFixed(2)}</strong>
                        </div>
                        <div className="summary-item">
                            <span className="summary-title">Total Income</span>
                            <strong>${totalIncome.toFixed(2)}</strong>
                        </div>
                        <div className="summary-item">
                            <span className="summary-title">Total Expenses</span>
                            <strong>${totalExpenses.toFixed(2)}</strong>
                        </div>
                        <div className="summary-item">
                            <span className="summary-title">Net Savings</span>
                            <strong>${netSavings.toFixed(2)}</strong>
                        </div>
                    </div>

                    <div className="ai-results-grid" style={{ marginTop: '20px' }}>
                        {accounts.map((account) => (
                            <div key={account._id} className="ai-card">
                                <div className="ai-card-header">
                                    <h3>{account.name}</h3>
                                    <span>{account.type}</span>
                                </div>
                                <p>${Number(account.balance || 0).toFixed(2)}</p>
                            </div>
                        ))}
                        {accounts.length === 0 && (
                            <div className="ai-card">
                                <div className="ai-card-header">
                                    <h3>No accounts available</h3>
                                </div>
                                <p>Create an account to see summary cards here.</p>
                            </div>
                        )}
                    </div>

                    <div className="ai-results-grid" style={{ marginTop: '20px' }}>
                        <div className="ai-card" style={{ gridColumn: '1 / -1' }}>
                            <div className="ai-card-header">
                                <h3>Recent Transactions</h3>
                                <span>{recentTransactions.length} latest</span>
                            </div>
                            {recentTransactions.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {recentTransactions.map((transaction) => (
                                        <li key={transaction._id} style={{ marginBottom: '12px' }}>
                                            <strong>{transaction.description}</strong>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563' }}>
                                                <span>{transaction.category} • {transaction.account}</span>
                                                <span>{transaction.type === 'Credit' ? '+' : '-'}${Number(transaction.amount || 0).toFixed(2)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No recent transactions available.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
