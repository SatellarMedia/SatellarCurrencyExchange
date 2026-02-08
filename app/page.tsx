import { CurrencyProvider } from '@/context/CurrencyContext';
// Components will be imported here later
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <CurrencyProvider>
      <main className="min-h-screen p-8 max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Currency Exchange
            </h1>
            <p className="text-slate-400 mt-2">Manage rates, transactions, and profits</p>
          </div>
          <div className="glass px-4 py-2 rounded-full text-sm text-slate-300">
             {new Date().toLocaleDateString()}
          </div>
        </header>

        <Dashboard />
      </main>
    </CurrencyProvider>
  );
}
