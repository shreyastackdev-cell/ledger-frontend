import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import { formatCurrency } from '../utils/formatCurrency';

const Contacts = () => {
    const toast = useToast();
    const [contacts, setContacts] = useState([]);
    const [balances, setBalances] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'balances'

    useEffect(() => {
        fetchContacts();
        fetchBalances();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchContacts();
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const fetchContacts = async () => {
        try {
            const params = {};
            if (search) params.search = search;
            const { data } = await api.get('/contacts', { params });
            setContacts(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalances = async () => {
        try {
            const { data } = await api.get('/contacts/balances');
            setBalances(data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingId) {
                const { data } = await api.put(`/contacts/${editingId}`, { name, phone });
                setContacts(contacts.map(c => c._id === editingId ? data.data : c));
                toast.success('Contact updated');
            } else {
                const { data } = await api.post('/contacts', { name, phone });
                setContacts([...contacts, data.data]);
                toast.success('Contact added');
            }
            resetForm();
            fetchBalances();
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to save contact';
            setError(msg);
            toast.error(msg);
        }
    };

    const handleEdit = (contact) => {
        setEditingId(contact._id);
        setName(contact.name);
        setPhone(contact.phone || '');
        setError('');
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setEditingId(null);
        setError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This contact will be removed from your list.')) return;
        try {
            await api.delete(`/contacts/${id}`);
            setContacts(contacts.filter(c => c._id !== id));
            if (editingId === id) resetForm();
            toast.success('Contact deleted');
            fetchBalances();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const getBalanceForContact = (contactId) => {
        return balances.find(b => b._id === contactId);
    };

    return (
        <div className="h-full">
            <header className="bg-white dark:bg-gray-800 shadow mb-6 rounded-lg">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contacts</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Add/Edit Contact Form */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 h-fit">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {editingId ? 'Edit Contact' : 'Add New Contact'}
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone (Optional)</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <button type="submit" className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                {editingId ? 'Update Contact' : 'Add Contact'}
                            </button>
                        </form>
                    </div>

                    {/* Contacts List & Balances */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        {/* Tab Toggle */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`pb-2 px-4 text-sm font-medium border-b-2 mr-4 transition-colors ${activeTab === 'list'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                All Contacts ({contacts.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('balances')}
                                className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'balances'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                Balances
                            </button>
                        </div>

                        {/* Search */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {loading ? <Spinner className="py-8" /> : (
                            <>
                                {activeTab === 'list' && (
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                                        {contacts.map(contact => {
                                            const bal = getBalanceForContact(contact._id);
                                            return (
                                                <li key={contact._id} className={`py-4 flex justify-between items-center ${editingId === contact._id ? 'bg-indigo-50 dark:bg-indigo-900/20 -mx-4 px-4 rounded' : ''}`}>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                                                        {contact.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{contact.phone}</p>}
                                                        {bal && (
                                                            <p className={`text-xs font-medium mt-0.5 ${bal.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {bal.balance >= 0 ? 'You get' : 'You owe'}: {formatCurrency(Math.abs(bal.balance))}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => handleEdit(contact)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm">
                                                            Edit
                                                        </button>
                                                        <Link to={`/transactions?contactId=${contact._id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                                                            History
                                                        </Link>
                                                        <button onClick={() => handleDelete(contact._id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm">
                                                            Delete
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                        {contacts.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No contacts found.</p>}
                                    </ul>
                                )}

                                {activeTab === 'balances' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Gave</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Took</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {balances.map(b => (
                                                    <tr key={b._id}>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                            <Link to={`/transactions?contactId=${b._id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                                                {b.contactName}
                                                            </Link>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">{formatCurrency(b.totalGave)}</td>
                                                        <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">{formatCurrency(b.totalTook)}</td>
                                                        <td className={`px-4 py-3 text-sm text-right font-semibold ${b.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {formatCurrency(b.balance)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {balances.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">No transaction data with contacts yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
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

export default Contacts;
