import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AIInsightsCard from './AIInsightsCard';

interface Transaction {
    id: string;
    date: string;
    description: string;
    category: string;
    account: string;
    type: string;
    amount: number;
}

interface AIResponse {
    spendingAnalysis: string;
    overspendingAreas: string;
    budgetRecommendations: string;
    savingsRecommendations: string;
    financialHealthScore: string;
}

const emptyAIResponse: AIResponse = {
    spendingAnalysis: '',
    overspendingAreas: '',
    budgetRecommendations: '',
    savingsRecommendations: '',
    financialHealthScore: '',
};

const Insights = () => {
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        highestSpendingCategory: 'N/A',
    });
    const [aiResponse, setAIResponse] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSummary, setHasSummary] = useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const loadTransactions = async (): Promise<Transaction[]> => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/transactions`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    };

    const calculateSummary = (transactions: Transaction[]) => {
        const totals = {
            totalIncome: 0,
            totalExpenses: 0,
            netSavings: 0,
            highestSpendingCategory: 'N/A',
        };

        if (transactions.length === 0) {
            return totals;
        }

        const categoryTotals: Record<string, number> = {};

        transactions.forEach((transaction) => {
            const amount = Number(transaction.amount) || 0;
            if (transaction.type === 'Credit') {
                totals.totalIncome += amount;
            } else {
                totals.totalExpenses += amount;
                categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;
            }
        });

        totals.netSavings = totals.totalIncome - totals.totalExpenses;

        const highest = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
        totals.highestSpendingCategory = highest ? highest[0] : 'N/A';

        return totals;
    };

    const buildGeminiPrompt = (summaryData: typeof summary) => {
        return `You are an AI financial advisor. Here is a summary of the user's latest financial data:

Total income: ${formatCurrency(summaryData.totalIncome)}
Total expenses: ${formatCurrency(summaryData.totalExpenses)}
Net savings: ${formatCurrency(summaryData.netSavings)}
Highest spending category: ${summaryData.highestSpendingCategory}

Provide the response as valid JSON with these keys:
- spendingAnalysis
- overspendingAreas
- budgetRecommendations
- savingsRecommendations
- financialHealthScore (a number between 0 and 100)

Do not include any extra text outside the JSON object.`;
    };

    const normalizeJsonString = (value: string): string => {
        const trimmed = value.trim();
        const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeFenceMatch?.[1]) {
            return codeFenceMatch[1].trim();
        }

        const objectMatch = trimmed.match(/({[\s\S]*})/);
        if (objectMatch?.[1]) {
            return objectMatch[1].trim();
        }

        return trimmed;
    };

    const parseGeminiResponse = (response: unknown): AIResponse => {
        if (response && typeof response === 'object' && !Array.isArray(response)) {
            const parsedObject = response as Record<string, unknown>;
            return {
                spendingAnalysis: String(parsedObject.spendingAnalysis || ''),
                overspendingAreas: String(parsedObject.overspendingAreas || ''),
                budgetRecommendations: String(parsedObject.budgetRecommendations || ''),
                savingsRecommendations: String(parsedObject.savingsRecommendations || ''),
                financialHealthScore: String(parsedObject.financialHealthScore || ''),
            };
        }

        if (typeof response !== 'string') {
            throw new Error('AI response is not parseable.');
        }

        const normalized = normalizeJsonString(response);
        const parsed = JSON.parse(normalized);

        return {
            spendingAnalysis: String(parsed.spendingAnalysis || ''),
            overspendingAreas: String(parsed.overspendingAreas || ''),
            budgetRecommendations: String(parsed.budgetRecommendations || ''),
            savingsRecommendations: String(parsed.savingsRecommendations || ''),
            financialHealthScore: String(parsed.financialHealthScore || ''),
        };
    };

    const generateAIAnalysis = async () => {
        setError('');
        setAIResponse(null);
        setIsLoading(true);

        const transactions = await loadTransactions();
        const summaryData = calculateSummary(transactions);
        setSummary(summaryData);
        setHasSummary(true);

        if (transactions.length === 0) {
            setError('No transaction data available. Add transactions first to generate AI analysis.');
            setIsLoading(false);
            return;
        }

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            setError('Gemini API key is missing. Set VITE_GEMINI_API_KEY in your environment.');
            setIsLoading(false);
            return;
        }

        const prompt = buildGeminiPrompt(summaryData);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(prompt);
            const rawText = result.response.text();

            const parsed = parseGeminiResponse(rawText);
            setAIResponse(parsed);
        } catch (fetchError) {
            const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
            setError(`Failed to parse AI response: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container ai-insights-page">
            <div className="page-header ai-page-header">
                <div>
                    <h1>AI Insights</h1>
                    <p>Generate a personalized financial analysis from your transaction summary.</p>
                </div>
                <Button onClick={generateAIAnalysis} disabled={isLoading}>
                    {isLoading ? 'Generating AI Analysis...' : 'Generate AI Analysis'}
                </Button>
            </div>

            <div className="summary-panel">
                <div className="summary-item">
                    <span className="summary-title">Total Income</span>
                    <strong>{formatCurrency(summary.totalIncome)}</strong>
                </div>
                <div className="summary-item">
                    <span className="summary-title">Total Expenses</span>
                    <strong>{formatCurrency(summary.totalExpenses)}</strong>
                </div>
                <div className="summary-item">
                    <span className="summary-title">Net Savings</span>
                    <strong>{formatCurrency(summary.netSavings)}</strong>
                </div>
                <div className="summary-item">
                    <span className="summary-title">Top Spending Category</span>
                    <strong>{summary.highestSpendingCategory}</strong>
                </div>
            </div>

            {error && <div className="ai-error-message">{error}</div>}

            {aiResponse && (
                <div className="ai-results-grid">
                    <AIInsightsCard
                        title="Spending Analysis"
                        value={aiResponse.financialHealthScore ? `Score: ${aiResponse.financialHealthScore}/100` : 'Analysis'}
                        description={aiResponse.spendingAnalysis}
                    />
                    <AIInsightsCard
                        title="Overspending Areas"
                        value="Review these categories"
                        description={aiResponse.overspendingAreas}
                    />
                    <AIInsightsCard
                        title="Budget Recommendations"
                        value="Plan smarter"
                        description={aiResponse.budgetRecommendations}
                    />
                    <AIInsightsCard
                        title="Savings Recommendations"
                        value="Save more"
                        description={aiResponse.savingsRecommendations}
                    />
                </div>
            )}

            {hasSummary && !aiResponse && !error && (
                <p className="ai-hint">Click the button to send this summary to Gemini and get an AI financial advisor report.</p>
            )}
        </div>
    );
};

export default Insights;
