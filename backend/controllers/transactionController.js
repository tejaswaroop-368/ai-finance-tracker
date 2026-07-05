import Transaction from '../models/Transaction.js';

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { account, date, description, category, type, amount } = req.body;

    if (!account || !date || !description || !category || !type || amount === undefined) {
      return res.status(400).json({ message: 'All transaction fields are required' });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      account,
      date: new Date(date),
      description,
      category,
      type,
      amount,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { account, date, description, category, type, amount } = req.body;

    const transaction = await Transaction.findOne({ _id: id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.account = account ?? transaction.account;
    transaction.date = date ? new Date(date) : transaction.date;
    transaction.description = description ?? transaction.description;
    transaction.category = category ?? transaction.category;
    transaction.type = type ?? transaction.type;
    transaction.amount = amount ?? transaction.amount;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
