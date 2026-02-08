'use client';

import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import RateSetter from './RateSetter';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';

export default function Dashboard() {
    const { holdings, profit } = useCurrency();

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Holdings Card - Full Width */}
            <section className="col-span-1 md:col-span-12 glass-card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-accent">Financial Status</h2>
                    <button
                        onClick={() => { if (confirm('Reset all data?')) window.location.reload(); }} // Simple reset trigger for now, better to use context reset
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        Reset System
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                        <div className="text-slate-400 text-sm">THB (Capital)</div>
                        <div className="text-2xl font-mono text-white font-bold">{holdings.THB.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </div>
                    {/* Profit Card */}
                    <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-green-400 text-sm font-bold">Realized Profit</div>
                        <div className="text-2xl font-mono text-green-300 font-bold overflow-hidden text-ellipsis">
                            +{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm">THB</span>
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-emerald-500/20">
                        <div className="text-slate-400 text-sm">USD</div>
                        <div className="text-2xl font-mono text-emerald-400 font-bold">{holdings.USD.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-red-500/20">
                        <div className="text-slate-400 text-sm">CNY</div>
                        <div className="text-2xl font-mono text-red-400 font-bold">{holdings.CNY.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-yellow-500/20">
                        <div className="text-slate-400 text-sm">MMK</div>
                        <div className="text-2xl font-mono text-yellow-400 font-bold">{holdings.MMK.toLocaleString()}</div>
                    </div>
                </div>
            </section>

            {/* Row 2: Rate Setter & Transaction Form */}
            <section className="col-span-1 md:col-span-12 lg:col-span-4">
                <RateSetter />
            </section>

            <section className="col-span-1 md:col-span-12 lg:col-span-5">
                <TransactionForm />
            </section>

            {/* Transaction List */}
            <section className="col-span-1 md:col-span-12 lg:col-span-3">
                <TransactionList />
            </section>

        </div>
    );
}
