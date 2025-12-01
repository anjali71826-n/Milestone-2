"use client";

import { useState } from "react";


type ProgressStep = "idle" | "fetching" | "fetched" | "grouping" | "grouped" | "generating" | "complete" | "error";

interface Review {
    id: string;
    userName: string;
    userImage?: string;
    date: string;
    score: number;
    title?: string;
    text: string;
    url?: string;
    version?: string;
    source: "google_play" | "app_store";
}


export default function Home() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<ProgressStep>("idle");
    const [progressMessage, setProgressMessage] = useState<string>("");
    const [stats, setStats] = useState<{ reviews?: number; grouped?: number }>({});
    const [email, setEmail] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [filter, setFilter] = useState<"all" | "google_play" | "app_store">("all");

    const handleSendEmail = async () => {
        if (!email || !result?.pulse) return;

        setSendingEmail(true);
        setEmailStatus(null);

        try {
            const response = await fetch("/api/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    pulse: result.pulse,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || "Failed to send email");
            }

            setEmailStatus({ type: "success", message: "Email sent successfully!" });
            setEmail("");
        } catch (err: any) {
            setEmailStatus({ type: "error", message: err.message });
        } finally {
            setSendingEmail(false);
        }
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setProgress("idle");
        setStats({});

        try {
            const eventSource = new EventSource("/api/analyze-stream");

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                setProgress(data.step);
                setProgressMessage(data.message);

                if (data.data) {
                    if (data.data.count !== undefined) {
                        if (data.step === "fetched") {
                            setStats(prev => ({ ...prev, reviews: data.data.count }));
                            if (data.data.reviews) {
                                setResult((prev: any) => ({ ...prev, reviews: data.data.reviews }));
                            }
                        } else if (data.step === "grouped") {
                            setStats(prev => ({ ...prev, grouped: data.data.count }));
                        }
                    }

                    if (data.step === "complete") {
                        setResult(data.data);
                        eventSource.close();
                        setLoading(false);
                    }
                }

                if (data.step === "error") {
                    setError(data.message);
                    eventSource.close();
                    setLoading(false);
                }
            };

            eventSource.onerror = () => {
                setError("Connection lost. Please try again.");
                eventSource.close();
                setLoading(false);
            };

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const getProgressPercentage = () => {
        const steps = ["idle", "fetching", "fetched", "grouping", "grouped", "generating", "complete"];
        const currentIndex = steps.indexOf(progress);
        return currentIndex === -1 ? 0 : (currentIndex / (steps.length - 1)) * 100;
    };

    const filteredReviews = result?.reviews?.filter((r: Review) => {
        if (filter === "all") return true;
        return r.source === filter;
    }) || [];

    return (
        <main className="flex min-h-screen flex-col items-center p-12 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-5xl w-full">
                <h1 className="text-5xl font-bold mb-2 text-gray-900">App Review Insights Analyzer</h1>
                <p className="text-gray-600 mb-8">Analyze app reviews and generate weekly insights</p>

                <div className="flex flex-col gap-6">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        {loading ? "Analyzing..." : "🚀 Run Analysis"}
                    </button>

                    {loading && (
                        <div className="bg-white border border-gray-200 px-6 py-5 rounded-lg shadow-md">
                            <h3 className="font-semibold text-lg mb-3 text-gray-800">Analysis Progress</h3>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${getProgressPercentage()}%` }}
                                />
                            </div>

                            {/* Current Step */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                                <span className="text-gray-700 font-medium">{progressMessage}</span>
                            </div>

                            {/* Step Indicators */}
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className={`p-3 rounded ${progress === "fetching" || progress === "fetched" ? "bg-blue-100 border-blue-300" : "bg-gray-50"} border`}>
                                    <div className="font-medium text-gray-700">📥 Fetching</div>
                                    {stats.reviews !== undefined && <div className="text-xs text-gray-600 mt-1">{stats.reviews} reviews</div>}
                                </div>
                                <div className={`p-3 rounded ${progress === "grouping" || progress === "grouped" ? "bg-green-100 border-green-300" : "bg-gray-50"} border`}>
                                    <div className="font-medium text-gray-700">🏷️ Grouping</div>
                                    {stats.grouped !== undefined && <div className="text-xs text-gray-600 mt-1">{stats.grouped} grouped</div>}
                                </div>
                                <div className={`p-3 rounded ${progress === "generating" || progress === "complete" ? "bg-purple-100 border-purple-300" : "bg-gray-50"} border`}>
                                    <div className="font-medium text-gray-700">📝 Generating</div>
                                    {progress === "complete" && <div className="text-xs text-green-600 mt-1">✓ Done</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">⚠️</span>
                                <span className="font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="bg-white border border-gray-200 px-6 py-5 rounded-lg shadow-lg">
                            {result.pulse && (
                                <>
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl">✅</span>
                                            <h2 className="font-bold text-2xl text-gray-900">
                                                {result.pulse?.title || "Weekly Pulse Report"}
                                            </h2>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href="/output/reviews.csv"
                                                download="reviews.csv"
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
                                            >
                                                📥 Download CSV
                                            </a>
                                            <a
                                                href="/output/weekly_note.md"
                                                download="weekly_note.md"
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
                                            >
                                                📥 Download Note
                                            </a>
                                        </div>
                                    </div>
                                    <div className="mb-5 flex gap-3 text-sm flex-wrap">
                                        <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
                                            📊 {result.reviewsCount} Reviews Analyzed
                                        </span>
                                        <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                                            🏷️ {result.groupedReviewsCount} Reviews Grouped
                                        </span>
                                    </div>
                                </>
                            )}

                            <div className="space-y-6">
                                {/* Overview */}
                                {result.pulse?.overview && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-800 mb-2">📋 Overview</h3>
                                        <p className="text-gray-700">{result.pulse.overview}</p>
                                    </div>
                                )}

                                {/* Top Themes */}
                                {result.pulse?.top_themes && (
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-800 mb-3">🎯 Top Themes</h3>
                                        <ul className="space-y-2">
                                            {Array.isArray(result.pulse.top_themes)
                                                ? result.pulse.top_themes.map((theme: string, idx: number) => (
                                                    <li key={idx} className="text-gray-700 flex items-start gap-2">
                                                        <span className="text-purple-600">•</span>
                                                        <span>{theme}</span>
                                                    </li>
                                                ))
                                                : typeof result.pulse.top_themes === 'string'
                                                    ? <li className="text-gray-700">{result.pulse.top_themes}</li>
                                                    : <li className="text-gray-700">{JSON.stringify(result.pulse.top_themes)}</li>
                                            }
                                        </ul>
                                    </div>
                                )}

                                {/* User Quotes */}
                                {result.pulse?.user_quotes && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-800 mb-3">💬 User Quotes</h3>
                                        <div className="space-y-3">
                                            {Array.isArray(result.pulse.user_quotes)
                                                ? result.pulse.user_quotes.map((quote: string, idx: number) => (
                                                    <blockquote key={idx} className="border-l-4 border-green-600 pl-4 italic text-gray-700">
                                                        "{quote}"
                                                    </blockquote>
                                                ))
                                                : typeof result.pulse.user_quotes === 'string'
                                                    ? <blockquote className="border-l-4 border-green-600 pl-4 italic text-gray-700">"{result.pulse.user_quotes}"</blockquote>
                                                    : <div className="text-gray-700">{JSON.stringify(result.pulse.user_quotes)}</div>
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* Action Ideas */}
                                {result.pulse?.action_ideas && (
                                    <div className="bg-amber-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-800 mb-3">💡 Action Ideas</h3>
                                        <ol className="space-y-2 list-decimal list-inside">
                                            {Array.isArray(result.pulse.action_ideas)
                                                ? result.pulse.action_ideas.map((idea: string, idx: number) => (
                                                    <li key={idx} className="text-gray-700">{idea}</li>
                                                ))
                                                : typeof result.pulse.action_ideas === 'string'
                                                    ? <li className="text-gray-700">{result.pulse.action_ideas}</li>
                                                    : <li className="text-gray-700">{JSON.stringify(result.pulse.action_ideas)}</li>
                                            }
                                        </ol>
                                    </div>
                                )}

                                {/* Fallback: Show raw JSON if structure is different */}
                                {!result.pulse?.overview && !result.pulse?.top_themes && !result.pulse?.html_report && (
                                    <div className="prose max-w-none">
                                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-5 rounded-lg border border-gray-200 overflow-auto max-h-[600px] leading-relaxed">
                                            {JSON.stringify(result.pulse, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {/* HTML Report Preview */}
                                {result.pulse?.html_report && (
                                    <div className="mt-8 border-t border-gray-200 pt-8">
                                        <h3 className="font-semibold text-gray-800 mb-4">📄 Email Report Preview</h3>
                                        <div className="bg-white border border-gray-300 p-4 rounded-lg shadow-inner overflow-auto max-h-[600px]">
                                            <iframe
                                                srcDoc={result.pulse.html_report}
                                                title="Report Preview"
                                                className="w-full h-[500px] border-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Email Section */}
                            {result.pulse && (
                                <div className="mt-8 border-t border-gray-200 pt-8">
                                    <h3 className="font-bold text-xl text-gray-900 mb-4">📧 Share Report</h3>
                                    <div className="flex gap-3 items-start">
                                        <div className="flex-1">
                                            <input
                                                type="email"
                                                placeholder="Enter email address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                            {emailStatus && (
                                                <p className={`text-sm mt-2 ${emailStatus.type === "success" ? "text-green-600" : "text-red-600"}`}>
                                                    {emailStatus.message}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={sendingEmail || !email}
                                            className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                                        >
                                            {sendingEmail ? "Sending..." : "Send Email"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Reviews List */}
                            {result.reviews && result.reviews.length > 0 && (
                                <div className="mt-8 border-t border-gray-200 pt-8">
                                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                                        <h2 className="font-bold text-2xl text-gray-900">
                                            📝 Raw Reviews ({filteredReviews.length})
                                        </h2>
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            <button
                                                onClick={() => setFilter("all")}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() => setFilter("google_play")}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === "google_play" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                                            >
                                                Play Store
                                            </button>
                                            <button
                                                onClick={() => setFilter("app_store")}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === "app_store" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                                            >
                                                App Store
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 max-h-[800px] overflow-y-auto pr-2">
                                        {filteredReviews.map((review: Review) => (
                                            <div key={review.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-800">{review.userName}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${review.source === "google_play" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                                                            {review.source === "google_play" ? "Google Play" : "App Store"}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`text-lg ${i < review.score ? "text-yellow-400" : "text-gray-300"}`}>
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                                {review.title && <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>}
                                                <p className="text-gray-700 text-sm whitespace-pre-wrap">{review.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
