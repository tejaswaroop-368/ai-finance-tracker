import Account from '../models/Account.js';

export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { name, type, balance } = req.body;

    if (!name || !type || balance === undefined) {
      return res.status(400).json({ message: 'Name, type and balance are required' });
    }

    const account = await Account.create({
      userId: req.user.id,
      name,
      type,
      balance,
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, balance } = req.body;

    const account = await Account.findOne({ _id: id, userId: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    account.name = name ?? account.name;
    account.type = type ?? account.type;
    account.balance = balance ?? account.balance;

    const updatedAccount = await account.save();
    res.json(updatedAccount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
