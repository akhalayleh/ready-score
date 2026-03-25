import { useState, useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

// ─── Category definitions with questions ───
const CATEGORIES = [
  {
    id: "awareness",
    label: "Awareness",
    subtitle: "Do you understand what could disrupt your household?",
    color: "#2e7d32",
    questions: [
      { text: "I know the most likely disruptions for where I live (weather, infrastructure, seismic, etc.)", id: "a1" },
      { text: "I understand how my building's infrastructure works (water, power, elevators, backup systems)", id: "a2" },
      { text: "I know what happens in my area when the power goes out for 24+ hours", id: "a3" },
      { text: "I've thought about how a disruption would affect my specific household (not just 'people in general')", id: "a4" },
    ],
  },
  {
    id: "supplies",
    label: "Supplies",
    subtitle: "Could you leave your home in 10 minutes with what you need for 3 days?",
    color: "#1565c0",
    questions: [
      { text: "I have a packed go-bag that I could grab and leave with right now", id: "s1" },
      { text: "My go-bag has water, food, and medications for at least 72 hours", id: "s2" },
      { text: "I've checked my go-bag contents in the last 3 months (nothing expired, batteries charged)", id: "s3" },
      { text: "I have additional supplies at home to shelter in place for 7+ days", id: "s4" },
    ],
  },
  {
    id: "records",
    label: "Records",
    subtitle: "Could you prove who you are and access your money from anywhere?",
    color: "#6a1b9a",
    questions: [
      { text: "I have copies of my key identity documents (passport, ID) stored separately from the originals", id: "r1" },
      { text: "I have digital backups of important documents in a secure cloud location", id: "r2" },
      { text: "I could access my bank accounts and move money from a new device if I lost my phone today", id: "r3" },
      { text: "I have a paper copy of essential contacts, account numbers, and insurance info (not just in my phone)", id: "r4" },
      { text: "I have cash on hand in small bills", id: "r5" },
    ],
  },
  {
    id: "home",
    label: "Home",
    subtitle: "Is your home set up to sustain you if you can't leave for a week?",
    color: "#e65100",
    questions: [
      { text: "I have enough stored water for my household for at least 3 days (1 gallon per person per day)", id: "h1" },
      { text: "I have a way to charge my phone if the power is out for 48 hours", id: "h2" },
      { text: "I know where my building's utility shutoffs are (water, gas, electrical panel)", id: "h3" },
      { text: "My medications are organized with at least a 7-day buffer before I'd run out", id: "h4" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    subtitle: "If cell networks went down, could your family find each other?",
    color: "#00838f",
    questions: [
      { text: "My household has a designated meeting point if we can't reach each other by phone", id: "c1" },
      { text: "I have an out-of-area contact person that all family members know to call", id: "c2" },
      { text: "I have a backup way to communicate beyond calling and texting (WiFi messaging, radio, etc.)", id: "c3" },
      { text: "The important people in my life know how to reach me if my primary phone number stops working", id: "c4" },
    ],
  },
  {
    id: "mobility",
    label: "Mobility",
    subtitle: "If you had to relocate in 48 hours, how much friction would you face?",
    color: "#ad1457",
    questions: [
      { text: "I know the termination terms for my lease, utilities, and major subscriptions", id: "m1" },
      { text: "I could list every recurring financial commitment I have (and how to cancel each one)", id: "m2" },
      { text: "My important belongings are organized enough that I could pack the essentials in under 2 hours", id: "m3" },
      { text: "If I live abroad: my visa, residence permit, and key documents are current and accessible", id: "m4" },
    ],
  },
  {
    id: "special",
    label: "Special Needs",
    subtitle: "Have you accounted for the specific people and animals in your care?",
    color: "#4e342e",
    questions: [
      { text: "I've thought about how each person in my household (children, elderly, medical needs) would be affected", id: "sp1" },
      { text: "If I have pets: I have a plan for their transport, food, and shelter that doesn't depend on 'figure it out later'", id: "sp2" },
      { text: "If anyone in my household has medical needs: there's a written summary a stranger could use in an emergency", id: "sp3" },
      { text: "I've discussed basic preparedness with my household (not just planned it in my head alone)", id: "sp4" },
    ],
  },
];

const SCORE_LABELS = [
  { value: 0, label: "Not at all", emoji: "" },
  { value: 1, label: "Thought about it", emoji: "" },
  { value: 2, label: "Partially done", emoji: "" },
  { value: 3, label: "Fully done", emoji: "" },
];

// ─── Gap analysis messaging ───
function getGapMessage(catId, score, maxScore) {
  const pct = score / maxScore;
  if (pct >= 0.8) return null;
  const messages = {
    awareness: "Most people underestimate how interconnected urban infrastructure is. A single failure (like power) cascades into water, communication, and transportation problems within hours. Understanding your specific situation is the foundation everything else builds on.",
    supplies: "This is your most actionable quick win. A basic Tier 1 go-bag can be assembled in 30 minutes with items you likely already own. The free go-bag checklist breaks this down step by step.",
    records: "Document access is the most common friction point people report after a disruption. The fix is a one-time organizational project (2-3 hours) plus a quarterly review habit.",
    home: "Your home is your first line of defense. Most disruptions are shelter-in-place situations, not evacuations. A week of self-sufficiency buys you time while systems recover.",
    communication: "Cell networks are the first infrastructure to degrade under load. Having a plan that doesn't depend entirely on your phone working normally is a gap most households never address until it's too late.",
    mobility: "This isn't about crisis — it's about optionality. Knowing your exit terms and having your life organized to move quickly serves you for job offers, family situations, and opportunities just as much as emergencies.",
    special: "The people and animals who depend on you have needs that generic preparedness doesn't cover. Addressing them specifically — and writing it down so others can help — is what separates a real plan from a vague intention.",
  };
  return messages[catId];
}

function getOverallMessage(totalPct) {
  if (totalPct >= 0.85) return { level: "Strong", color: "#2e7d32", message: "You're well ahead of most households. Focus on maintaining what you've built and closing any remaining gaps." };
  if (totalPct >= 0.65) return { level: "Solid foundation", color: "#1565c0", message: "You've done more than most. A few targeted improvements would make a meaningful difference." };
  if (totalPct >= 0.40) return { level: "Getting started", color: "#e65100", message: "You've taken some steps. The good news: the highest-impact improvements are usually the quickest to do." };
  return { level: "Fresh start", color: "#ad1457", message: "You're starting from scratch, which is actually a great position — no bad habits to undo. Start with Supplies (your go-bag) for the fastest win." };
}

// ─── Main Component ───
export default function ReadyScore() {
  const [answers, setAnswers] = useState({});
  const [currentCat, setCurrentCat] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [started, setStarted] = useState(false);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const catScores = useMemo(() => {
    return CATEGORIES.map(cat => {
      const maxScore = cat.questions.length * 3;
      const score = cat.questions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
      return { id: cat.id, label: cat.label, score, maxScore, pct: maxScore > 0 ? score / maxScore : 0 };
    });
  }, [answers]);

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = CATEGORIES.reduce((sum, c) => sum + c.questions.length, 0);
  const totalScore = catScores.reduce((sum, c) => sum + c.score, 0);
  const totalMax = catScores.reduce((sum, c) => sum + c.maxScore, 0);
  const totalPct = totalMax > 0 ? totalScore / totalMax : 0;
  const readyScore = Math.round(totalPct * 100);

  const radarData = catScores.map(c => ({
    category: c.label,
    score: Math.round(c.pct * 100),
    fullMark: 100,
  }));

  const currentCategory = CATEGORIES[currentCat];
  const currentCatAnswered = currentCategory ? currentCategory.questions.filter(q => answers[q.id] !== undefined).length : 0;
  const currentCatComplete = currentCategory ? currentCatAnswered === currentCategory.questions.length : false;

  const overallMsg = getOverallMessage(totalPct);
  const weakest = [...catScores].sort((a, b) => a.pct - b.pct);

  // ─── Intro Screen ───
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">The Ready Score</h1>
          <p className="text-gray-500 mb-6">A 5-minute self-assessment for household preparedness</p>
          <div className="h-1 w-16 bg-rose-500 rounded mb-6"></div>
          <p className="text-gray-700 mb-4">
            This assessment covers 7 dimensions of household readiness. For each statement,
            rate how true it is for your household right now — not where you'd like to be.
          </p>
          <p className="text-gray-700 mb-6">
            There are no wrong answers. The goal is to see where you stand so you know
            where to focus first.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <span className="text-sm text-gray-600">{cat.label}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{totalQuestions} questions</span> across 7 categories.
              Takes about 5 minutes. Your answers stay in your browser — nothing is stored or sent anywhere.
            </p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="w-full py-3 px-6 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  // ─── Results Screen ───
  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Score Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Your Ready Score</p>
            <div className="text-7xl font-bold mb-2" style={{ color: overallMsg.color }}>{readyScore}</div>
            <p className="text-lg font-semibold mb-1" style={{ color: overallMsg.color }}>{overallMsg.level}</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">{overallMsg.message}</p>
          </div>

          {/* Radar Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Readiness Profile</h2>
            <div className="w-full" style={{ height: 320 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Radar name="Score" dataKey="score" stroke="#1a1a2e" fill="#1a1a2e" fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: "#1a1a2e" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Category Breakdown</h2>
            <div className="space-y-4">
              {catScores.map(cat => {
                const catDef = CATEGORIES.find(c => c.id === cat.id);
                const pctRound = Math.round(cat.pct * 100);
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-semibold text-gray-700">{cat.label}</span>
                      <span className="text-sm font-bold" style={{ color: catDef.color }}>{pctRound}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${pctRound}%`, backgroundColor: catDef.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gap Analysis */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Where to Focus</h2>
            <p className="text-sm text-gray-500 mb-4">Your biggest opportunities for improvement, in priority order:</p>
            <div className="space-y-4">
              {weakest.filter(c => c.pct < 0.8).slice(0, 3).map((cat, i) => {
                const catDef = CATEGORIES.find(c => c.id === cat.id);
                const msg = getGapMessage(cat.id, cat.score, cat.maxScore);
                if (!msg) return null;
                return (
                  <div key={cat.id} className="border-l-4 pl-4 py-2" style={{ borderColor: catDef.color }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: catDef.color }}>
                        #{i + 1}
                      </span>
                      <span className="font-semibold text-gray-800">{cat.label}</span>
                      <span className="text-sm text-gray-400">({Math.round(cat.pct * 100)}%)</span>
                    </div>
                    <p className="text-sm text-gray-600">{msg}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gray-900 rounded-2xl p-6 mb-6 text-center">
            <p className="text-gray-300 text-sm mb-2">This assessment is part of a full course on household preparedness.</p>
            <p className="text-white font-semibold mb-3">
              7 modules covering everything from go-bags to relocation readiness — all sourced to official guidance, all designed for urban households.
            </p>
            <p className="text-gray-400 text-sm">[your-course-url]</p>
          </div>

          {/* Retake */}
          <div className="text-center mb-8">
            <button
              onClick={() => { setAnswers({}); setCurrentCat(0); setShowResults(false); }}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Retake assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Question Screen ───
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Question {totalAnswered} of {totalQuestions}</span>
            <span>{Math.round((totalAnswered / totalQuestions) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-gray-900 transition-all duration-300"
              style={{ width: `${(totalAnswered / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map((cat, i) => {
            const catComplete = cat.questions.every(q => answers[q.id] !== undefined);
            const isActive = i === currentCat;
            return (
              <button
                key={cat.id}
                onClick={() => setCurrentCat(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "text-white shadow-sm"
                    : catComplete
                    ? "bg-gray-100 text-gray-500"
                    : "bg-white text-gray-400 border border-gray-200"
                }`}
                style={isActive ? { backgroundColor: cat.color } : {}}
              >
                {catComplete && !isActive ? "\u2713 " : ""}{cat.label}
              </button>
            );
          })}
        </div>

        {/* Category header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentCategory.color }}></div>
            <h2 className="text-xl font-bold text-gray-900">{currentCategory.label}</h2>
          </div>
          <p className="text-gray-500 text-sm">{currentCategory.subtitle}</p>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {currentCategory.questions.map((q) => {
            const currentVal = answers[q.id];
            return (
              <div key={q.id} className="bg-white rounded-xl shadow-sm p-5">
                <p className="text-sm text-gray-700 mb-3">{q.text}</p>
                <div className="flex gap-2">
                  {SCORE_LABELS.map(opt => {
                    const isSelected = currentVal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(q.id, opt.value)}
                        className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all border ${
                          isSelected
                            ? "border-transparent text-white shadow-sm"
                            : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
                        }`}
                        style={isSelected ? { backgroundColor: currentCategory.color } : {}}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 mb-8">
          <button
            onClick={() => setCurrentCat(prev => Math.max(0, prev - 1))}
            disabled={currentCat === 0}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
          >
            Previous
          </button>
          {currentCat < CATEGORIES.length - 1 ? (
            <button
              onClick={() => setCurrentCat(prev => prev + 1)}
              className="px-6 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              Next category
            </button>
          ) : (
            <button
              onClick={() => setShowResults(true)}
              disabled={totalAnswered < totalQuestions}
              className="px-6 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              See my Ready Score
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
