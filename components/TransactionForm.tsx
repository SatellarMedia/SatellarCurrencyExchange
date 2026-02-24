'use client';

import React, { useState, useEffect } from 'react';
import { useCurrency, Currency, getRateBasis } from '@/context/CurrencyContext';

export default function TransactionForm() {
    const { rates, addTransaction, holdings } = useCurrency();

    const [type, setType] = useState<'BUY' | 'SELL'>('BUY'); // BUY = Shop buys Foreign (Out THB), SELL = Shop sells Foreign (In THB)
    // WAIT: "Buy" usually means user buys FROM shop? Or Shop buys FROM user?
    // Context: "Currency Exchange Shop".
    // "Buy USD" -> Shop buys USD from customer. Shop gives THB. (Inventory USD goes UP, THB goes DOWN) -> Uses "We Buy" rate.
    // "Sell USD" -> Shop sells USD to customer. Shop gets THB. (Inventory USD goes DOWN, THB goes UP) -> Uses "We Sell" rate.

    // Let's clarify in UI.

    const [currency, setCurrency] = useState<Currency>('MMK');
    const [amount, setAmount] = useState<string>('');
    const [total, setTotal] = useState<string>('');
    const [lastEdited, setLastEdited] = useState<'amount' | 'total'>('amount');
    const [customRate, setCustomRate] = useState<string>(''); // Allow override? Request said "rate is manual" which usually means global manual, but sometimes per tx.
    // "rate is manual" in request: "currency is thb,mmk,cny,usd. rate is manual."
    // Logic: Default to global rate, but allow override if needed? Or just show global rate?
    // Let's allow override for flexibility, default to global.

    useEffect(() => {
        // Update custom rate when currency or type changes
        // Cast currency to key of Rates, ensuring we don't access with 'THB' if logic fails (though limited by UI)
        if (currency === 'THB') return;

        const curKey = currency as keyof typeof rates;
        const rateData = rates[curKey];

        const rateToUse = type === 'BUY' ? rateData?.buy : rateData?.sell;
        if (rateToUse) {
            setCustomRate(rateToUse.toString());
        }
    }, [type, currency, rates]);

    useEffect(() => {
        const basis = getRateBasis(currency);
        const numRate = parseFloat(customRate);

        if (isNaN(numRate) || numRate <= 0) return;

        if (lastEdited === 'amount') {
            const numAmount = parseFloat(amount);
            if (!isNaN(numAmount)) {
                setTotal(((numAmount / basis) * numRate).toFixed(2));
            } else if (amount === '') {
                setTotal('');
            }
        } else if (lastEdited === 'total') {
            const numTotal = parseFloat(total);
            if (!isNaN(numTotal)) {
                setAmount(((numTotal / numRate) * basis).toFixed(2));
            } else if (total === '') {
                setAmount('');
            }
        }
    }, [amount, total, customRate, currency, lastEdited]);

    const handleAmountChange = (val: string) => {
        setLastEdited('amount');
        setAmount(val);
    };

    const handleTotalChange = (val: string) => {
        setLastEdited('total');
        setTotal(val);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        const numRate = parseFloat(customRate);

        if (!numAmount || !numRate) return;

        // Validation
        if (type === 'SELL') {
            // Check if we have enough foreign currency
            // Wait, shop can go negative if we allow "shorting" or just tracking?
            // Better to warn but allow, or block?
            // Let's block for now to be safe, or just warn.
            if (holdings[currency] < numAmount) {
                if (!confirm(`Warning: You only have ${holdings[currency]} ${currency}. Sell anyway?`)) {
                    return;
                }
            }
        } else {
            // Buying foreign currency -> paying THB. Check THB balance?
            // Shop usually has cash.
        }

        addTransaction(type, currency, numAmount, numRate);
        setAmount('');
        setTotal('');
        // Keep rate as is
    };

    return (
        <div className="glass-card">
            <h2 className="text-xl font-bold mb-4 text-accent">New Transaction</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle */}
                <div className="flex bg-black/20 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setType('BUY')}
                        className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'BUY' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Buy {currency}
                        <span className="block text-xs font-normal opacity-70">Customer sells to us</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('SELL')}
                        className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'SELL' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Sell {currency}
                        <span className="block text-xs font-normal opacity-70">We sell to customer</span>
                    </button>
                </div>

                {/* Currency Select */}
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Currency</label>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="glass-input appearance-none"
                    >
                        <option value="MMK">MMK (Myanmar Kyat)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="CNY">CNY (Chinese Yuan)</option>
                    </select>
                </div>

                {/* Amount Input */}
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Amount ({currency})</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="glass-input text-lg font-bold"
                        required
                    />
                </div>

                {/* Rate Input */}
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Exchange Rate</label>
                    <input
                        type="number"
                        step="0.0001"
                        value={customRate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        className="glass-input"
                        required
                    />
                </div>

                {/* Total Input */}
                <div className="p-4 bg-black/30 rounded-lg border border-white/5 focus-within:border-white/20 transition-colors">
                    <div className="flex justify-between items-center">
                        <label className="text-slate-400">Total (THB)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={total}
                            onChange={(e) => handleTotalChange(e.target.value)}
                            placeholder="0.00"
                            className={`bg-transparent outline-none text-right text-xl font-bold w-1/2 min-w-0 ${type === 'BUY' ? 'text-blue-400' : 'text-green-400'}`}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-95 ${type === 'BUY' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'}`}
                >
                    {type === 'BUY' ? `CONFIRM BUY ${currency}` : `CONFIRM SELL ${currency}`}
                </button>

            </form>
        </div>
    );
}
