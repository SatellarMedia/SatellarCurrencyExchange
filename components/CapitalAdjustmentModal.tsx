'use client';

import React, { useState, useEffect } from 'react';
import { useCurrency, Currency, Holdings } from '@/context/CurrencyContext';

interface CapitalAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CapitalAdjustmentModal({ isOpen, onClose }: CapitalAdjustmentModalProps) {
    const { holdings, updateHolding } = useCurrency();
    const [localHoldings, setLocalHoldings] = useState<Holdings>(holdings);

    useEffect(() => {
        if (isOpen) {
            setLocalHoldings(holdings);
        }
    }, [isOpen, holdings]);

    if (!isOpen) return null;

    const handleChange = (currency: keyof Holdings, value: string) => {
        const numValue = parseFloat(value);
        setLocalHoldings(prev => ({
            ...prev,
            [currency]: isNaN(numValue) ? 0 : numValue
        }));
    };

    const handleSave = () => {
        // Update all
        (Object.keys(localHoldings) as Array<keyof Holdings>).forEach(key => {
            updateHolding(key as Currency, localHoldings[key]);
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Edit Financial Status</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm mb-4">
                        Warning: Modifying these values will directly overwrite the current system balance.
                        It will not create a transaction record.
                    </div>

                    {/* THB */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">THB (Capital)</label>
                        <input
                            type="number"
                            value={localHoldings.THB}
                            onChange={(e) => handleChange('THB', e.target.value)}
                            className="glass-input text-right font-mono"
                        />
                    </div>

                    {/* USD */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">USD</label>
                        <input
                            type="number"
                            value={localHoldings.USD}
                            onChange={(e) => handleChange('USD', e.target.value)}
                            className="glass-input text-right font-mono text-emerald-400"
                        />
                    </div>

                    {/* CNY */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">CNY</label>
                        <input
                            type="number"
                            value={localHoldings.CNY}
                            onChange={(e) => handleChange('CNY', e.target.value)}
                            className="glass-input text-right font-mono text-red-400"
                        />
                    </div>

                    {/* MMK */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">MMK</label>
                        <input
                            type="number"
                            value={localHoldings.MMK}
                            onChange={(e) => handleChange('MMK', e.target.value)}
                            className="glass-input text-right font-mono text-yellow-400"
                        />
                    </div>
                </div>

                <div className="flex space-x-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
