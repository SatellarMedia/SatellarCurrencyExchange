'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useCurrency } from '@/context/CurrencyContext';
import RateSetter from './RateSetter';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import CapitalAdjustmentModal from './CapitalAdjustmentModal';

export default function Dashboard() {
    const { holdings, profit, resetData, transactions } = useCurrency();
    const [isEditingCapital, setIsEditingCapital] = useState(false);

    const handleExportExcel = () => {
        // 1. Prepare Overview Data
        const overviewData = [
            { "Metric": "THB (Capital)", "Value": holdings.THB },
            { "Metric": "Realized Profit (THB)", "Value": profit },
            { "Metric": "USD Holdings", "Value": holdings.USD },
            { "Metric": "CNY Holdings", "Value": holdings.CNY },
            { "Metric": "MMK Holdings", "Value": holdings.MMK },
            { "Metric": "Total Transactions", "Value": transactions.length },
        ];

        // 2. Prepare Transactions Data
        const txData = transactions.map(tx => ({
            "Date & Time": new Date(tx.date).toLocaleString(),
            "Type": tx.type,
            "Currency": tx.currency,
            "Amount": tx.amount,
            "Exchange Rate": tx.rate,
            "Total (THB)": tx.totalTHB
        }));

        // 3. Create Workbook & Sheets
        const wb = XLSX.utils.book_new();
        const wsOverview = XLSX.utils.json_to_sheet(overviewData);
        const wsTx = XLSX.utils.json_to_sheet(txData);

        // Styling columns width roughly
        wsOverview['!cols'] = [{ wch: 25 }, { wch: 15 }];
        wsTx['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, wsOverview, "Daily Summary");
        XLSX.utils.book_append_sheet(wb, wsTx, "Transactions Log");

        // 4. Download file
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Currency_Exchange_Report_${dateStr}.xlsx`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <CapitalAdjustmentModal
                isOpen={isEditingCapital}
                onClose={() => setIsEditingCapital(false)}
            />

            {/* Holdings Card - Full Width */}
            <section className="col-span-1 md:col-span-12 glass-card">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-accent">Financial Status</h2>
                        <button
                            onClick={() => setIsEditingCapital(true)}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded text-xs transition-colors border border-white/10"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportExcel}
                            className="text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Save Daily Report
                        </button>
                        <button
                            onClick={() => {
                                const enteredPin = prompt('Enter Reset PIN:');
                                if (enteredPin === '001554') {
                                    if (confirm('Are you sure you want to reset the profit to 0?')) {
                                        resetData();
                                        window.location.reload();
                                    }
                                } else if (enteredPin !== null) {
                                    alert('Incorrect PIN.');
                                }
                            }}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors py-1.5"
                        >
                            Reset System
                        </button>
                    </div>
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
            </section >

            {/* Row 2: Rate Setter & Transaction Form */}
            < section className="col-span-1 md:col-span-12 lg:col-span-4" >
                <RateSetter />
            </section >

            <section className="col-span-1 md:col-span-12 lg:col-span-5">
                <TransactionForm />
            </section>

            {/* Transaction List */}
            <section className="col-span-1 md:col-span-12 lg:col-span-3">
                <TransactionList />
            </section>

        </div >
    );
}
