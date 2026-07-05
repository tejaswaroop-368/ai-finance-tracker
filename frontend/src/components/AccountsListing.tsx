import { useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import AccountModal from './AccountModal';
import { fetchAccounts, createAccount, updateAccount, deleteAccount } from '../utils/accountsApi';

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
}

interface DropdownPosition {
    top: number;
    left: number;
}

const normalizeAccount = (account: any): Account => ({
    id: account._id || account.id,
    name: account.name,
    type: account.type,
    balance: account.balance,
});

const AccountsListing = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({ top: 0, left: 0 });
    const [feedback, setFeedback] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadAccounts = async () => {
            try {
                const data = await fetchAccounts();
                setAccounts(Array.isArray(data) ? data.map(normalizeAccount) : []);
            } catch (error: any) {
                setFeedback(error.message || 'Unable to load accounts');
            }
        };

        loadAccounts();
    }, []);

    const handleShowModal = () => {
        setFeedback('');
        setEditingAccount(null);
        setShowModal(true);
    };

    const handleEditAccount = (account: Account) => {
        setFeedback('');
        setEditingAccount(account);
        setShowModal(true);
        setShowActionsMenu(null);
    };

    const handleDeleteAccount = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            try {
                await deleteAccount(id);
                setAccounts((currentAccounts) => currentAccounts.filter(account => account.id !== id));
                setShowActionsMenu(null);
                setFeedback('Account deleted');
                window.dispatchEvent(new Event('finance-data-changed'));
            } catch (error: any) {
                setFeedback(error.message || 'Unable to delete account');
            }
        }
    };

    const handleSaveAccount = async (account: Account) => {
        try {
            if (editingAccount) {
                const updated = await updateAccount(account.id, {
                    name: account.name,
                    type: account.type,
                    balance: account.balance,
                });
                setAccounts((currentAccounts) => currentAccounts.map(acc => acc.id === updated._id ? { ...acc, ...updated, id: updated._id } : acc));
            } else {
                const created = await createAccount({
                    name: account.name,
                    type: account.type,
                    balance: account.balance,
                });
                setAccounts((currentAccounts) => [...currentAccounts, { ...created, id: created._id }]);
            }
            setShowModal(false);
            setFeedback(editingAccount ? 'Account updated' : 'Account created');
            window.dispatchEvent(new Event('finance-data-changed'));
        } catch (error: any) {
            setFeedback(error.message || 'Invalid request');
        }
    };

    const toggleActionsMenu = (accountId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (showActionsMenu === accountId) {
            setShowActionsMenu(null);
        } else {
            // Calculate position of the dropdown
            const button = (e.target as HTMLElement).closest('.actions-btn') as HTMLElement;
            if (button) {
                const rect = button.getBoundingClientRect();
                const dropdownHeight = 80; // Approximate height of dropdown (2 items)
                const viewportHeight = window.innerHeight;
                
                // Check if there's enough space below, otherwise position above
                let top = rect.bottom + window.scrollY;
                if (rect.bottom + dropdownHeight > viewportHeight - 20) {
                    top = rect.top + window.scrollY - dropdownHeight;
                }
                
                const left = rect.left + window.scrollX - 100; // Align dropdown to the right
                
                setDropdownPos({ top, left });
            }
            
            setShowActionsMenu(accountId);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowActionsMenu(null);
            }
        };

        if (showActionsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showActionsMenu]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="accounts-container">
            <div className="accounts-header">
                <h1 className="accounts-title">Accounts</h1>
                <Button 
                    className="add-account-btn" 
                    onClick={handleShowModal}
                >
                    + Add Account
                </Button>
            </div>

            {feedback && (
                <div className="ai-error-message" style={{ marginBottom: '12px' }}>
                    {feedback}
                </div>
            )}

            {accounts.length > 0 ? (
                <div className="accounts-table-wrapper">
                    <table className="accounts-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header-cell">Account Name</th>
                                <th className="table-header-cell">Type</th>
                                <th className="table-header-cell">Current Balance</th>
                                <th className="table-header-cell">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((account) => (
                                <tr key={account.id} className="table-body-row">
                                    <td className="table-body-cell">{account.name}</td>
                                    <td className="table-body-cell">{account.type}</td>
                                    <td className="table-body-cell balance-cell">{formatCurrency(account.balance)}</td>
                                    <td className="table-body-cell actions-cell">
                                        <div className="actions-menu-container" ref={dropdownRef}>
                                            <button
                                                className="actions-btn"
                                                onClick={(e) => toggleActionsMenu(account.id, e)}
                                            >
                                                ⋮
                                            </button>
                                            {showActionsMenu === account.id && (
                                                <div
                                                    className="actions-dropdown"
                                                    style={{
                                                        top: `${dropdownPos.top}px`,
                                                        left: `${dropdownPos.left}px`,
                                                    }}
                                                >
                                                    <button
                                                        className="action-item edit-action"
                                                        onClick={() => handleEditAccount(account)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="action-item delete-action"
                                                        onClick={() => handleDeleteAccount(account.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="accounts-empty-state">
                    <p>No accounts found. Click "Add Account" to get started.</p>
                </div>
            )}

            <AccountModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSave={handleSaveAccount}
                editingAccount={editingAccount}
            />
        </div>
    );
};

export default AccountsListing;
