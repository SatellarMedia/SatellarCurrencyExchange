'use client';

import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';

export default function TransactionList() {
    const { transactions } = useCurrency();

    if (transactions.length === 0) {
        return (
            <div className="glass-card h-full flex items-center justify-center text-slate-500">
                No transactions yet.
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-accent">Recent Transactions</h2>
            <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                    <thead className="bg-white/5 text-slate-300 sticky top-0 backdrop-blur-md">
                        <tr>
                            <th className="p-3 text-left">Time</th>
                            <th className="p-3 text-left">Type</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-right">Rate</th>
                            <th className="p-3 text-right">Total (THB)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-3 text-slate-400">
                                    {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                        {tx.type} {tx.currency}
                                    </span>
                                </td>
                                <td className="p-3 text-right font-mono">{tx.amount.toLocaleString()}</td>
                                <td className="p-3 text-right text-slate-400">{tx.rate.toFixed(4)}</td>
                                <td className="p-3 text-right font-bold text-slate-200">{tx.totalTHB.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
