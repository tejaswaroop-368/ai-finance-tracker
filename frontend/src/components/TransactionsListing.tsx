import { useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import TransactionModal from './TransactionModal';
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from '../utils/transactionsApi';

interface Transaction {
    id: string;
    date: string;
    description: string;
    category: string;
    account: string;
    type: string;
    amount: number;
}

interface DropdownPosition {
    top: number;
    left: number;
}

const formatDisplayDate = (value: string) => {
    if (!value) {
        return '';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }

    return parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const normalizeTransaction = (transaction: any): Transaction => ({
    id: transaction._id || transaction.id,
    date: transaction.date,
    description: transaction.description,
    category: transaction.category,
    account: transaction.account,
    type: transaction.type,
    amount: transaction.amount,
});

const TransactionsListing = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({ top: 0, left: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [feedback, setFeedback] = useState('');
    const itemsPerPage = 10;
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        const loadTransactions = async () => {
            try {
                const data = await fetchTransactions();
                setTransactions(Array.isArray(data) ? data.map(normalizeTransaction) : []);
            } catch (error: any) {
                setFeedback(error.message || 'Unable to load transactions');
            }
        };

        loadTransactions();
    }, []);

    const handleShowModal = () => {
        setFeedback('');
        setEditingTransaction(null);
        setShowModal(true);
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setFeedback('');
        setShowActionsMenu(null);
        setEditingTransaction(transaction);
        setShowModal(true);
    };

    const handleDeleteTransaction = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await deleteTransaction(id);
                setTransactions((currentTransactions) => currentTransactions.filter(transaction => transaction.id !== id));
                setShowActionsMenu(null);
                setFeedback('Transaction deleted');
                window.dispatchEvent(new Event('finance-data-changed'));
            } catch (error: any) {
                setFeedback(error.message || 'Unable to delete transaction');
            }
        }
    };

    const handleSaveTransaction = async (transaction: Transaction) => {
        try {
            if (editingTransaction) {
                const updated = await updateTransaction(transaction.id, {
                    date: transaction.date,
                    description: transaction.description,
                    category: transaction.category,
                    account: transaction.account,
                    type: transaction.type,
                    amount: transaction.amount,
                });
                setTransactions((currentTransactions) => currentTransactions.map(txn => txn.id === transaction.id ? { ...txn, ...updated, id: updated._id } : txn));
            } else {
                const created = await createTransaction({
                    date: transaction.date,
                    description: transaction.description,
                    category: transaction.category,
                    account: transaction.account,
                    type: transaction.type,
                    amount: transaction.amount,
                });
                setTransactions((currentTransactions) => [...currentTransactions, { ...created, id: created._id }]);
            }
            setShowModal(false);
            setEditingTransaction(null);
            setFeedback(editingTransaction ? 'Transaction updated' : 'Transaction created');
            window.dispatchEvent(new Event('finance-data-changed'));
        } catch (error: any) {
            throw new Error(error.message || 'Invalid request');
        }
    };

    const toggleActionsMenu = (transactionId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (showActionsMenu === transactionId) {
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

            setShowActionsMenu(transactionId);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const currentRef = Object.values(dropdownRefs.current).find(ref => 
                ref && ref.contains(target)
            );
            if (!currentRef) {
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
        }).format(Math.abs(amount));
    };

    // Pagination
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="transactions-container">
            <div className="transactions-header">
                <h1 className="transactions-title">Transactions</h1>
                <Button
                    className="add-transaction-btn"
                    onClick={handleShowModal}
                >
                    + Add Transaction
                </Button>
            </div>

            {feedback && (
                <div className="ai-error-message" style={{ marginBottom: '12px' }}>
                    {feedback}
                </div>
            )}

            {transactions.length > 0 ? (
                <>
                    <div className="transactions-table-wrapper">
                        <table className="transactions-table">
                            <thead>
                                <tr className="table-header-row">
                                    <th className="table-header-cell">Date</th>
                                    <th className="table-header-cell">Description</th>
                                    <th className="table-header-cell">Category</th>
                                    <th className="table-header-cell">Account</th>
                                    <th className="table-header-cell">Type</th>
                                    <th className="table-header-cell">Amount</th>
                                    <th className="table-header-cell">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="table-body-row">
                                        <td className="table-body-cell">{formatDisplayDate(transaction.date)}</td>
                                        <td className="table-body-cell">{transaction.description}</td>
                                        <td className="table-body-cell">{transaction.category}</td>
                                        <td className="table-body-cell">{transaction.account}</td>
                                        <td className="table-body-cell">
                                            <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                                                {transaction.type}
                                            </span>
                                        </td>
                                        <td className="table-body-cell amount-cell">
                                            {formatCurrency(transaction.amount)}
                                        </td>
                                        <td className="table-body-cell actions-cell">
                                            <div 
                                                className="actions-menu-container" 
                                                ref={(el) => {
                                                    if (el) dropdownRefs.current[transaction.id] = el;
                                                }}
                                            >
                                                <button
                                                    className="actions-btn"
                                                    onClick={(e) => toggleActionsMenu(transaction.id, e)}
                                                >
                                                    ⋮
                                                </button>
                                                {showActionsMenu === transaction.id && (
                                                    <div
                                                        className="actions-dropdown"
                                                        style={{
                                                            top: `${dropdownPos.top}px`,
                                                            left: `${dropdownPos.left}px`,
                                                        }}
                                                    >
                                                        <button
                                                            className="action-item edit-action"
                                                            onClick={() => handleEditTransaction(transaction)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="action-item delete-action"
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <div className="pagination-info">
                                Showing 1 to {Math.min(itemsPerPage, transactions.length)} of {transactions.length}
                            </div>
                            <div className="pagination-buttons">
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    ←
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    →
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="transactions-empty-state">
                    <p>No transactions found. Click "Add Transaction" to get started.</p>
                </div>
            )}

            <TransactionModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSave={handleSaveTransaction}
                editingTransaction={editingTransaction}
            />
        </div>
    );
};

export default TransactionsListing;
