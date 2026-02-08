'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export type Currency = 'THB' | 'MMK' | 'CNY' | 'USD';

export interface ExchangeRate {
    buy: number;  // Rate we buy at (lower)
    sell: number; // Rate we sell at (higher)
}

// Map of currency pairs relative to base (usually THB or direct pairs).
// For simplicity, we'll store rates for each currency against THB or just raw rates if they are distinct pairs.
// The user request implies "currency is thb,mmk,cny,usd".
// Let's assume THB is the base currency for now, or just handle pairs explicitly.
// Common pairs might be USD/THB, CNY/THB, MMK/THB (or THB/MMK).
// Given "manual rate", I'll allow setting rates for specific pairs.
// Let's support: USD, CNY, MMK. THB is likely the "home" currency.
export interface Rates {
    USD: ExchangeRate;
    CNY: ExchangeRate;
    MMK: ExchangeRate;
}

export interface Transaction {
    id: string;
    type: 'BUY' | 'SELL';
    currency: Currency;
    amount: number;
    rate: number;
    totalTHB: number;
    date: string;
}

export interface Holdings {
    THB: number;
    USD: number;
    CNY: number;
    MMK: number;
}

interface CurrencyContextType {
    rates: Rates;
    setRates: (rates: Rates) => void;
    holdings: Holdings;
    transactions: Transaction[];
    addTransaction: (type: 'BUY' | 'SELL', currency: Currency, amount: number, rate: number) => void;
    profit: number; // Realized profit
    resetData: () => void;
}

const defaultRates: Rates = {
    USD: { buy: 34.0, sell: 34.5 },
    CNY: { buy: 4.8, sell: 4.9 },
    MMK: { buy: 0.015, sell: 0.016 }, // Approx rate, usually handled as 1000 MMK (?)
    // Note: MMK rates often quoted as "per 1000" or similar. We'll store raw unit rate for calculation 
    // but UI might need to adjust. For now, strict unit math.
};

const defaultHoldings: Holdings = {
    THB: 1000000, // Initial capital example
    USD: 0,
    CNY: 0,
    MMK: 0,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [rates, setRatesState] = useState<Rates>(defaultRates);
    const [holdings, setHoldings] = useState<Holdings>(defaultHoldings);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [profit, setProfit] = useState(0);
    // Track average cost for each currency to calculate profit
    // { USD: 34.0, ... }
    const [averageCosts, setAverageCosts] = useState<{ [key in Currency]?: number }>({});

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedRates = localStorage.getItem('exchange_rates');
        const savedHoldings = localStorage.getItem('exchange_holdings');
        const savedTx = localStorage.getItem('exchange_transactions');
        const savedProfit = localStorage.getItem('exchange_profit');
        const savedAvgCosts = localStorage.getItem('exchange_average_costs');

        if (savedRates) setRatesState(JSON.parse(savedRates) as Rates);
        if (savedHoldings) setHoldings(JSON.parse(savedHoldings) as Holdings);
        if (savedTx) setTransactions(JSON.parse(savedTx) as Transaction[]);
        if (savedProfit) setProfit(Number(savedProfit));
        if (savedAvgCosts) setAverageCosts(JSON.parse(savedAvgCosts));
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        localStorage.setItem('exchange_rates', JSON.stringify(rates));
        localStorage.setItem('exchange_holdings', JSON.stringify(holdings));
        localStorage.setItem('exchange_transactions', JSON.stringify(transactions));
        localStorage.setItem('exchange_profit', profit.toString());
        localStorage.setItem('exchange_average_costs', JSON.stringify(averageCosts));
    }, [rates, holdings, transactions, profit, averageCosts]);

    const setRates = (newRates: Rates) => {
        setRatesState(newRates);
    };

    const addTransaction = (type: 'BUY' | 'SELL', currency: Currency, amount: number, rate: number) => {
        if (currency === 'THB') return; // Cannot buy/sell base currency against itself directly here

        const totalTHB = amount * rate;
        // Check if crypto is available (client-side)
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

        const newTx: Transaction = {
            id,
            type,
            currency,
            amount,
            rate,
            totalTHB,
            date: new Date().toISOString(),
        };

        setTransactions(prev => [newTx, ...prev]);

        setHoldings(prev => {
            const newHoldings = { ...prev };
            const currentAmount = prev[currency] || 0;
            const currentAvgCost = averageCosts[currency] || 0;

            if (type === 'BUY') {
                // Buying Foreign: Shop gives THB, gets Foreign
                // Update WAC (Weighted Average Cost)
                // New Cost = ((Old Amt * Old Cost) + (New Amt * New Rate)) / (Old Amt + New Amt)

                let newAvgCost = currentAvgCost;

                // Only update WAC if we are adding positive amount
                const totalValue = (currentAmount * currentAvgCost) + (amount * rate);
                const newTotalAmount = currentAmount + amount;

                if (newTotalAmount > 0) {
                    newAvgCost = totalValue / newTotalAmount;
                } else {
                    // Reset if 0 or negative (rare)
                    newAvgCost = rate;
                }

                setAverageCosts(prevCosts => ({
                    ...prevCosts,
                    [currency]: newAvgCost
                }));

                newHoldings.THB -= totalTHB;
                newHoldings[currency] += amount;

            } else {
                // Selling Foreign: Shop gives Foreign, gets THB
                // Profit = (Sell Rate - Avg Cost) * Amount

                // Use current avg cost. If 0 (no history), fallback to current Buy rate (conservative estimate)
                const costBasis = currentAvgCost > 0 ? currentAvgCost : (rates[currency]?.buy || 0);
                const txProfit = (rate - costBasis) * amount;

                setProfit(prevP => prevP + txProfit);

                newHoldings.THB += totalTHB;
                newHoldings[currency] -= amount;

                // WAC does not change on Sell (FIFO/Average Cost assumption),
                // unless we want to handle "Selling all and resetting".
                // If holdings go to 0, strict WAC says cost is still there until new buy, 
                // but for practicality, if we go to 0, maybe we don't clear it yet, 
                // as next buy will average it.
                // However, if we go *negative*, WAC gets weird.
            }
            return newHoldings;
        });
    };

    const resetData = () => {
        setRates(defaultRates);
        setHoldings(defaultHoldings);
        setTransactions([]);
        setProfit(0);
        setAverageCosts({});
        localStorage.clear();
    };

    return (
        <CurrencyContext.Provider value={{ rates, setRates, holdings, transactions, addTransaction, profit, resetData }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
