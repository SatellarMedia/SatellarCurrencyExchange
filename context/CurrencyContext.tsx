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
    updateHolding: (currency: Currency, amount: number) => void;
    profit: number; // Realized profit
    resetData: () => void;
}

// Helper to get basis
export const getRateBasis = (currency: String) => {
    return currency === 'MMK' ? 100000 : 1;
}

const defaultRates: Rates = {
    USD: { buy: 34.0, sell: 34.5 },
    CNY: { buy: 4.8, sell: 4.9 },
    MMK: { buy: 775, sell: 800 }, // NOW per 100,000 MMK
};

const defaultHoldings: Holdings = {
    THB: 30000, // Initial capital example
    USD: 0,
    CNY: 0,
    MMK: 20000000,
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

    /**
     * Directly update the holding for a specific currency.
     * Use this for manual adjustments (Capital Edit).
     */
    const updateHolding = (currency: Currency, newAmount: number) => {
        setHoldings(prev => {
            const newHoldings = { ...prev, [currency]: newAmount };
            // If updating Foreign currency manually, reset its Average Cost to current market BUY rate 
            // to prevent "free" inventory dragging down cost basis when new transactions occur.
            if (currency !== 'THB') {
                const basis = getRateBasis(currency);
                setAverageCosts(prevC => ({
                    ...prevC,
                    [currency]: (rates[currency]?.buy || 0) / basis
                }));
            }
            return newHoldings;
        });
    };

    const addTransaction = (type: 'BUY' | 'SELL', currency: Currency, amount: number, rate: number) => {
        if (currency === 'THB') return;

        // Apply Basis: MMK rate is "Per 100,000", others "Per 1".
        // Total THB = (Amount / Basis) * Rate
        const basis = getRateBasis(currency);
        const totalTHB = (amount / basis) * rate;

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
                // WAC Calculation:
                // New Cost = ((Old Amt * Old Cost) + (Total THB Value)) / (Old Amt + New Amt)
                // Note: stored "averageCosts" should be in PER UNIT (e.g. per 1 MMK) or PER BASIS?
                // Let's store "Per Unit" cost internally for math consistency, 
                // but if we store "Per Basis", we need to be careful everywhere.
                // EASIEST: Store "Cost per 1 Unit" in averageCosts always.
                // Rate passed in is "Per Basis". 
                // Unit Price = Rate / Basis.

                const unitPrice = rate / basis;

                // If this is the FIRST buy ever, or we previously edited to have inventory but no cost
                let effectiveCurrentAvgCost = currentAvgCost;
                if (effectiveCurrentAvgCost <= 0) {
                    // Fallback to the current buy rate per unit
                    effectiveCurrentAvgCost = (rates[currency]?.buy || 0) / basis;
                    if (effectiveCurrentAvgCost <= 0) effectiveCurrentAvgCost = unitPrice;
                }

                // Total historical THB value based on the effective cost
                const currentTotalValue = currentAmount * effectiveCurrentAvgCost;
                // Total THB value of this new transaction
                const newTotalValue = currentTotalValue + totalTHB;
                // Total new amount
                const newTotalAmount = currentAmount + amount;

                let newAvgCost = unitPrice;
                if (newTotalAmount > 0) {
                    newAvgCost = newTotalValue / newTotalAmount;
                }

                setAverageCosts(prevCosts => ({
                    ...prevCosts,
                    [currency]: newAvgCost
                }));

                newHoldings.THB -= totalTHB;
                newHoldings[currency] += amount;

            } else {
                // Selling Foreign: Shop gives Foreign, gets THB
                // Profit = (Sell Price - Avg Cost) * Amount
                // Sell Price (Total) = totalTHB
                // Cost Basis (Total) = Avg Cost * Amount

                // If no history, assume current Sell Rate/Basis as cost (0 profit), or Buy Rate (conservative).
                // Let's use current avg cost if valid.
                let unitCost = currentAvgCost;
                if (unitCost <= 0) {
                    // Fallback: estimate from current BUY rate
                    unitCost = (rates[currency]?.buy || 0) / basis;
                }

                const totalCost = amount * unitCost;
                const txProfit = totalTHB - totalCost;

                setProfit(prevP => prevP + txProfit);

                newHoldings.THB += totalTHB;
                newHoldings[currency] -= amount;
            }
            return newHoldings;
        });
    };

    const resetData = () => {
        setTransactions([]);
        setProfit(0);

        // Sync local storage immediately before any potential reload
        localStorage.setItem('exchange_transactions', JSON.stringify([]));
        localStorage.setItem('exchange_profit', '0');
    };

    return (
        <CurrencyContext.Provider value={{ rates, setRates, holdings, transactions, addTransaction, profit, resetData, updateHolding }}>
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
