import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { formatCurrency } from '../utils/formatCurrency';

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await api.get('/dashboard/summary');
                setSummary(data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) {
        return <Spinner className="py-20" size="lg" />;
    }

    return (
        <div className="h-full">
            {user && (
                <header className="bg-white dark:bg-gray-800 shadow mb-6 rounded-lg">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Welcome back, {user.name}!</p>
                    </div>
                </header>
            )}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {summary ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Income Card */}
                            <Link to="/transactions?type=TOOK" className="block transform transition-transform hover:scale-105">
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Income</dt>
                                    <dd className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(summary.totalTook)}</dd>
                                </div>
                            </Link>
                            {/* Expense Card */}
                            <Link to="/transactions?type=GAVE" className="block transform transition-transform hover:scale-105">
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Expense</dt>
                                    <dd className="mt-1 text-3xl font-semibold text-red-600 dark:text-red-400">{formatCurrency(summary.totalGave)}</dd>
                                </div>
                            </Link>
                            {/* Net Balance Card */}
                            <Link to="/transactions" className="block transform transition-transform hover:scale-105">
                                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Net Balance</dt>
                                    <dd className={`mt-1 text-3xl font-semibold ${summary.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(summary.netBalance)}
                                    </dd>
                                </div>
                            </Link>
                        </div>

                        {/* Recent Transactions */}
                        {summary.recentTransactions && summary.recentTransactions.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
                                    <Link to="/transactions" className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">View All →</Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {summary.recentTransactions.map(t => (
                                                <tr key={t._id}>
                                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(t.transactionDate).toLocaleDateString('en-IN')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {t.contact ? (
                                                            <span className="font-medium text-indigo-600 dark:text-indigo-400">{t.contact.name}</span>
                                                        ) : (
                                                            <span className="text-gray-500 dark:text-gray-400 italic">Personal</span>
                                                        )}
                                                        {t.note && <span className="block text-xs text-gray-400">{t.note}</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'TOOK'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}>
                                                            {t.type === 'TOOK' ? 'Income' : 'Expense'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-4 py-3 text-sm text-right font-medium ${t.type === 'TOOK' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {formatCurrency(t.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No data available yet. Start by adding transactions!</p>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
