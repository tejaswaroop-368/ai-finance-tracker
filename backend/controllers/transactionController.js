import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';

const isExpenseType = (type) => ['debit', 'expense'].includes(String(type).trim().toLowerCase());

const getAccountByName = async (userId, accountName) => {
  return Account.findOne({ userId, name: accountName });
};

const applyTransactionEffectToBalance = (balance, type, amount) => {
  const numericAmount = Number(amount);
  if (isExpenseType(type)) {
    return Number(balance) - numericAmount;
  }

  return Number(balance) + numericAmount;
};

const removeTransactionEffectFromBalance = (balance, type, amount) => {
  const numericAmount = Number(amount);
  if (isExpenseType(type)) {
    return Number(balance) + numericAmount;
  }

  return Number(balance) - numericAmount;
};

const applyTransactionEffect = async (accountDoc, type, amount) => {
  if (!accountDoc) {
    return null;
  }

  accountDoc.balance = applyTransactionEffectToBalance(accountDoc.balance, type, amount);
  await accountDoc.save();
  return accountDoc;
};

const revertTransactionEffect = async (accountDoc, type, amount) => {
  if (!accountDoc) {
    return null;
  }

  accountDoc.balance = removeTransactionEffectFromBalance(accountDoc.balance, type, amount);
  await accountDoc.save();
  return accountDoc;
};

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

    const accountDoc = await getAccountByName(req.user.id, account);
    if (!accountDoc) {
      return res.status(400).json({ message: 'Account not found' });
    }

    const numericAmount = Number(amount);
    if (isExpenseType(type) && Number(accountDoc.balance) < numericAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      account,
      date: new Date(date),
      description,
      category,
      type,
      amount: numericAmount,
    });

    await applyTransactionEffect(accountDoc, type, numericAmount);

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const { account, date, description, category, type, amount } = req.body;

    const transaction = await Transaction.findOne({ _id: id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const previousAccountName = transaction.account;
    const previousType = transaction.type;
    const previousAmount = Number(transaction.amount);
    const nextAccountName = account ?? previousAccountName;
    const nextType = type ?? previousType;
    const nextAmount = amount === undefined ? previousAmount : Number(amount);
    const numericAmount = Number(nextAmount);

    const previousAccountDoc = await getAccountByName(req.user.id, previousAccountName);
    const targetAccountDoc = await getAccountByName(req.user.id, nextAccountName);
    if (!targetAccountDoc) {
      return res.status(400).json({ message: 'Account not found' });
    }

    let projectedBalance = Number(targetAccountDoc.balance);
    if (previousAccountName === nextAccountName) {
      projectedBalance = removeTransactionEffectFromBalance(projectedBalance, previousType, previousAmount);
    }

    projectedBalance = applyTransactionEffectToBalance(projectedBalance, nextType, numericAmount);
    if (isExpenseType(nextType) && projectedBalance < 0) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (previousAccountName !== nextAccountName && previousAccountDoc) {
      await revertTransactionEffect(previousAccountDoc, previousType, previousAmount);
    }

    if (previousAccountName === nextAccountName) {
      await revertTransactionEffect(targetAccountDoc, previousType, previousAmount);
    }

    await applyTransactionEffect(targetAccountDoc, nextType, numericAmount);

    transaction.account = nextAccountName;
    transaction.date = date ? new Date(date) : transaction.date;
    transaction.description = description ?? transaction.description;
    transaction.category = category ?? transaction.category;
    transaction.type = nextType;
    transaction.amount = numericAmount;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const transaction = await Transaction.findOne({ _id: id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const accountDoc = await getAccountByName(req.user.id, transaction.account);
    if (accountDoc) {
      await revertTransactionEffect(accountDoc, transaction.type, transaction.amount);
    }

    await Transaction.deleteOne({ _id: id, userId: req.user.id });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
