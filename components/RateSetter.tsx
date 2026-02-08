'use client';

import React, { useState, useEffect } from 'react';
import { useCurrency, Rates, Currency } from '@/context/CurrencyContext';

export default function RateSetter() {
    const { rates, setRates } = useCurrency();
    const [localRates, setLocalRates] = useState<Rates>(rates);
    const [isEditing, setIsEditing] = useState(false);

    // Sync local state when global rates change (unless editing)
    useEffect(() => {
        if (!isEditing) {
            setLocalRates(rates);
        }
    }, [rates, isEditing]);

    const handleChange = (currency: Currency, type: 'buy' | 'sell', value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        setLocalRates(prev => ({
            ...prev,
            [currency]: {
                ...prev[currency as keyof Rates],
                [type]: numValue
            }
        }));
    };

    const handleSave = () => {
        setRates(localRates);
        setIsEditing(false);
    };

    const CURRENCIES: Currency[] = ['USD', 'CNY', 'MMK']; // Exclude THB as base

    return (
        <div className="glass-card">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-accent">Exchange Rates (THB)</h2>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${isEditing ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                >
                    {isEditing ? 'Save Rates' : 'Edit Rates'}
                </button>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm text-slate-400 font-medium mb-2">
                    <div>Currency</div>
                    <div>We Buy (In)</div>
                    <div>We Sell (Out)</div>
                </div>

                {CURRENCIES.map((currency) => (
                    <div key={currency} className="grid grid-cols-3 gap-2 items-center">
                        <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${currency === 'USD' ? 'bg-emerald-400' : currency === 'CNY' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                            <span className="font-bold">{currency}</span>
                        </div>

                        <input
                            type="number"
                            step="0.0001"
                            value={localRates[currency as keyof Rates].buy || ''}
                            onChange={(e) => handleChange(currency, 'buy', e.target.value)}
                            disabled={!isEditing}
                            className={`glass-input text-right ${!isEditing && 'opacity-70 border-transparent bg-transparent'}`}
                        />

                        <input
                            type="number"
                            step="0.0001"
                            value={localRates[currency as keyof Rates].sell || ''}
                            onChange={(e) => handleChange(currency, 'sell', e.target.value)}
                            disabled={!isEditing}
                            className={`glass-input text-right ${!isEditing && 'opacity-70 border-transparent bg-transparent'}`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
