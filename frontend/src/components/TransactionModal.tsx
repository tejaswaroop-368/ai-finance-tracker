import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface Transaction {
    id: string;
    date: string;
    description: string;
    category: string;
    account: string;
    type: string;
    amount: number;
}

interface TransactionModalProps {
    show: boolean;
    onHide: () => void;
    onSave: (transaction: Transaction) => Promise<void> | void;
    editingTransaction?: Transaction | null;
}

const API_URL = import.meta.env.VITE_API_URL;

const formatDateForInput = (value?: string | Date) => {
    if (!value) {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
};

const toIsoDateString = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toISOString();
};

const TransactionModal = ({ show, onHide, onSave, editingTransaction }: TransactionModalProps) => {
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Groceries');
    const [account, setAccount] = useState('Checking Account');
    const [type, setType] = useState('Debit');
    const [amount, setAmount] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [submitError, setSubmitError] = useState('');
    const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);

    const categories = ['Groceries', 'Transport', 'Dining', 'Entertainment', 'Utilities', 'Income', 'Other'];

    useEffect(() => {
        const loadAccounts = async () => {
            try {
                const response = await fetch(`${API_URL}/api/accounts`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const names = (Array.isArray(data) ? data : []).map((item: any) => item.name).filter(Boolean);
                setAvailableAccounts(names);
            } catch (error) {
                console.error('Unable to load accounts', error);
            }
        };

        loadAccounts();
    }, []);

    useEffect(() => {
        if (editingTransaction) {
            setDate(formatDateForInput(editingTransaction.date));
            setDescription(editingTransaction.description);
            setCategory(editingTransaction.category);
            setAccount(editingTransaction.account || availableAccounts[0] || 'Checking Account');
            setType(editingTransaction.type);
            setAmount(editingTransaction.amount.toString());
        } else {
            setDate(formatDateForInput());
            setDescription('');
            setCategory('Groceries');
            setAccount(availableAccounts[0] || 'Checking Account');
            setType('Debit');
            setAmount('');
        }
        setErrors({});
        setSubmitError('');
    }, [editingTransaction, show, availableAccounts]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!date.trim()) {
            newErrors.date = 'Date is required';
        }

        if (!description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!category) {
            newErrors.category = 'Category is required';
        }

        if (!account) {
            newErrors.account = 'Account is required';
        }

        if (!type) {
            newErrors.type = 'Type is required';
        }

        if (!amount || isNaN(parseFloat(amount))) {
            newErrors.amount = 'Valid amount is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        const newTransaction: Transaction = {
            id: editingTransaction?.id || Date.now().toString(),
            date: toIsoDateString(date),
            description,
            category,
            account,
            type,
            amount: parseFloat(amount),
        };

        try {
            setSubmitError('');
            await onSave(newTransaction);
            handleClose();
        } catch (error: any) {
            setSubmitError(error.message || 'Failed to save transaction');
        }
    };

    const handleClose = () => {
        setDate('');
        setDescription('');
        setCategory('Groceries');
        setAccount('Checking Account');
        setType('Debit');
        setAmount('');
        setErrors({});
        setSubmitError('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg" className="transaction-modal">
            <Modal.Header closeButton className="transaction-modal-header">
                <Modal.Title className="transaction-modal-title">
                    {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="transaction-modal-body">
                <Form>
                    <div className="form-row">
                        <Form.Group className="mb-4 form-col" controlId="formDate">
                            <Form.Label className="transaction-form-label">Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={`transaction-form-control ${errors.date ? 'is-invalid' : ''}`}
                                isInvalid={!!errors.date}
                            />
                            {errors.date && (
                                <Form.Control.Feedback type="invalid">{errors.date}</Form.Control.Feedback>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-4 form-col" controlId="formType">
                            <Form.Label className="transaction-form-label">Type</Form.Label>
                            <Form.Select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className={`transaction-form-control ${errors.type ? 'is-invalid' : ''}`}
                            >
                                <option>Debit</option>
                                <option>Credit</option>
                            </Form.Select>
                            {errors.type && (
                                <div className="invalid-feedback d-block">{errors.type}</div>
                            )}
                        </Form.Group>
                    </div>

                    <Form.Group className="mb-4" controlId="formDescription">
                        <Form.Label className="transaction-form-label">Description</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`transaction-form-control ${errors.description ? 'is-invalid' : ''}`}
                            isInvalid={!!errors.description}
                        />
                        {errors.description && (
                            <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                        )}
                    </Form.Group>

                    <div className="form-row">
                        <Form.Group className="mb-4 form-col" controlId="formCategory">
                            <Form.Label className="transaction-form-label">Category</Form.Label>
                            <Form.Select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={`transaction-form-control ${errors.category ? 'is-invalid' : ''}`}
                            >
                                {categories.map((cat) => (
                                    <option key={cat}>{cat}</option>
                                ))}
                            </Form.Select>
                            {errors.category && (
                                <div className="invalid-feedback d-block">{errors.category}</div>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-4 form-col" controlId="formAccount">
                            <Form.Label className="transaction-form-label">Account</Form.Label>
                            <Form.Select
                                value={account}
                                onChange={(e) => setAccount(e.target.value)}
                                className={`transaction-form-control ${errors.account ? 'is-invalid' : ''}`}
                            >
                                {availableAccounts.length > 0 ? (
                                    availableAccounts.map((acc) => (
                                        <option key={acc}>{acc}</option>
                                    ))
                                ) : (
                                    <option>Checking Account</option>
                                )}
                            </Form.Select>
                            {errors.account && (
                                <div className="invalid-feedback d-block">{errors.account}</div>
                            )}
                        </Form.Group>
                    </div>

                    <Form.Group className="mb-4" controlId="formAmount">
                        <Form.Label className="transaction-form-label">Amount</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={`transaction-form-control ${errors.amount ? 'is-invalid' : ''}`}
                            isInvalid={!!errors.amount || !!submitError}
                            step="0.01"
                        />
                        {errors.amount && (
                            <Form.Control.Feedback type="invalid">{errors.amount}</Form.Control.Feedback>
                        )}
                        {submitError && (
                            <div className="invalid-feedback d-block">{submitError}</div>
                        )}
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="transaction-modal-footer">
                <Button variant="outline-secondary" onClick={handleClose} className="transaction-cancel-btn">
                    Cancel
                </Button>
                <Button variant="dark" onClick={handleSave} className="transaction-save-btn">
                    {editingTransaction ? 'Update' : 'Add'} Transaction
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TransactionModal;
