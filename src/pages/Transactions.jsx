import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import { formatCurrency } from '../utils/formatCurrency';

const Transactions = () => {
    const location = useLocation();
    const toast = useToast();
    const [transactions, setTransactions] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    // Form State
    const [type, setType] = useState('GAVE');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [contactId, setContactId] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingId, setEditingId] = useState(null);

    // Filter State
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeQuickFilter, setActiveQuickFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTransactions();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search, startDate, endDate, currentPage, location.search]);

    useEffect(() => {
        fetchContacts();
        const params = new URLSearchParams(location.search);
        const contactIdParam = params.get('contactId');
        const typeParam = params.get('type');
        if (contactIdParam) setContactId(contactIdParam);
        if (typeParam) setType(typeParam);
    }, [location.search]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const queryParams = { search, startDate, endDate, page: currentPage, limit: 15 };
            const urlParams = new URLSearchParams(location.search);
            if (urlParams.get('contactId')) queryParams.contactId = urlParams.get('contactId');
            if (urlParams.get('type')) queryParams.type = urlParams.get('type');

            const { data } = await api.get('/transactions', { params: queryParams });
            setTransactions(data.data);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchContacts = async () => {
        try {
            const { data } = await api.get('/contacts');
            setContacts(data.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Quick date filters
    const applyQuickFilter = (filter) => {
        const today = new Date();
        let start = '';
        let end = today.toISOString().split('T')[0];

        if (activeQuickFilter === filter) {
            // Toggle off
            setActiveQuickFilter('');
            setStartDate('');
            setEndDate('');
            return;
        }

        switch (filter) {
            case 'today':
                start = end;
                break;
            case 'week': {
                const d = new Date(today);
                d.setDate(d.getDate() - d.getDay());
                start = d.toISOString().split('T')[0];
                break;
            }
            case 'month':
                start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
                break;
        }
        setActiveQuickFilter(filter);
        setStartDate(start);
        setEndDate(end);
        setCurrentPage(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = {
                type,
                amount: Number(amount),
                note,
                transactionDate: transactionDate || undefined
            };
            if (contactId) payload.contact = contactId;
            else payload.contact = null;

            if (editingId) {
                const { data } = await api.put(`/transactions/${editingId}`, payload);
                setTransactions(transactions.map(t => t._id === editingId ? data.data : t));
                toast.success('Transaction updated');
            } else {
                const { data } = await api.post('/transactions', payload);
                setTransactions([data.data, ...transactions]);
                toast.success('Transaction added');
            }
            resetForm();
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to save transaction';
            setError(msg);
            toast.error(msg);
        }
    };

    const handleEdit = (transaction) => {
        setEditingId(transaction._id);
        setType(transaction.type);
        setAmount(transaction.amount);
        setNote(transaction.note || '');
        setContactId(transaction.contact ? transaction.contact._id : '');
        setTransactionDate(transaction.transactionDate ? new Date(transaction.transactionDate).toISOString().split('T')[0] : '');
        setError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await api.delete(`/transactions/${id}`);
            setTransactions(transactions.filter(t => t._id !== id));
            if (editingId === id) resetForm();
            toast.success('Transaction deleted');
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const resetForm = () => {
        setAmount('');
        setNote('');
        setContactId('');
        setEditingId(null);
        setType('GAVE');
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setError('');
    };

    return (
        <div className="h-full">
            <header className="bg-white dark:bg-gray-800 shadow mb-6 rounded-lg">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[
                            { key: 'today', label: 'Today' },
                            { key: 'week', label: 'This Week' },
                            { key: 'month', label: 'This Month' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => applyQuickFilter(f.key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors
                                    ${activeQuickFilter === f.key
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
                            <input
                                type="text"
                                placeholder="Search notes..."
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                            <input
                                type="date"
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setActiveQuickFilter(''); setCurrentPage(1); }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                            <input
                                type="date"
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setActiveQuickFilter(''); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add/Edit Transaction Form */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 h-fit md:col-span-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {editingId ? 'Edit Transaction' : 'Record Transaction'}
                            </h3>
                            {editingId && (
                                <button onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    Cancel
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <div className="flex rounded-md shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setType('GAVE')}
                                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${type === 'GAVE'
                                            ? 'bg-red-600 text-white border-red-600'
                                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('TOOK')}
                                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border ${type === 'TOOK'
                                            ? 'bg-green-600 text-white border-green-600'
                                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    value={transactionDate}
                                    onChange={(e) => setTransactionDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact (Optional)</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    value={contactId}
                                    onChange={(e) => setContactId(e.target.value)}
                                >
                                    <option value="">-- Personal / No Contact --</option>
                                    {contacts.map(contact => (
                                        <option key={contact._id} value={contact._id}>
                                            {contact.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>

                            <button type="submit" className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                {editingId ? 'Update Transaction' : 'Add Transaction'}
                            </button>
                        </form>
                    </div>

                    {/* Transactions List */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                History {pagination.total > 0 && <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">({pagination.total})</span>}
                            </h3>
                            <button onClick={() => { setCurrentPage(1); fetchTransactions(); }} className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">Refresh</button>
                        </div>
                        {loading ? (
                            <Spinner className="py-12" />
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Note/Contact</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {(transactions || []).map(t => (
                                                <tr key={t._id} className={editingId === t._id ? 'bg-indigo-50 dark:bg-indigo-900' : ''}>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(t.transactionDate).toLocaleDateString('en-IN')}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {t.contact ? (
                                                            <span className="font-medium text-indigo-600 dark:text-indigo-400">{t.contact.name}</span>
                                                        ) : (
                                                            <span className="text-gray-500 dark:text-gray-400 italic">Personal</span>
                                                        )}
                                                        {t.note && <span className="block text-gray-500 dark:text-gray-400 text-xs">{t.note}</span>}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'TOOK'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}>
                                                            {t.type === 'TOOK' ? 'Income' : 'Expense'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${t.type === 'TOOK' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {formatCurrency(t.amount)}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        <button onClick={() => handleEdit(t)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(t._id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {transactions.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No transactions found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                                        </p>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage <= 1}
                                                className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Prev
                                            </button>
                                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                                let page;
                                                if (pagination.pages <= 5) {
                                                    page = i + 1;
                                                } else if (currentPage <= 3) {
                                                    page = i + 1;
                                                } else if (currentPage >= pagination.pages - 2) {
                                                    page = pagination.pages - 4 + i;
                                                } else {
                                                    page = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`px-3 py-1.5 text-sm rounded border ${currentPage === page
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                                                disabled={currentPage >= pagination.pages}
                                                className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Transactions;
