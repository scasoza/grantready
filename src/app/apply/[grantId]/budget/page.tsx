"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { grants } from "@/lib/grants";

interface BudgetItem {
  id?: string;
  category: string;
  description: string;
  amount: number;
  justification: string;
  sort_order: number;
}

const EXAMPLE_CATEGORIES = [
  { category: "Personnel", example: "Lead Teacher (0.5 FTE x 12 months)", amount: 18000 },
  { category: "Personnel", example: "Teacher Assistant (part-time, 20 hrs/wk x 12 months)", amount: 12000 },
  { category: "Supplies", example: "Classroom materials and curriculum resources", amount: 2500 },
  { category: "Equipment", example: "Learning center furniture and storage", amount: 3000 },
  { category: "Training", example: "Staff professional development (CDA coursework)", amount: 1500 },
  { category: "Other", example: "Parent engagement events and materials", amount: 1000 },
];

export default function BudgetPage() {
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);
  const grantId = Number(params.grantId);
  const grant = grants.find((g) => g.id === grantId);

  const [items, setItems] = useState<BudgetItem[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing budget items
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: center, error: centerError } = await supabase
        .from("centers").select("id").eq("user_id", user.id).single();
      if (centerError || !center) return;

      const { data: app, error: appError } = await supabase
        .from("applications").select("id")
        .eq("center_id", center.id).eq("grant_id", String(grantId)).single();
      if (appError || !app) return;

      setApplicationId(app.id);

      const { data: budgetItems } = await supabase
        .from("budget_items").select("*")
        .eq("application_id", app.id).order("sort_order");

      if (budgetItems && budgetItems.length > 0) {
        setItems(budgetItems.map((b) => ({
          id: b.id,
          category: b.category,
          description: b.description || "",
          amount: Number(b.amount) || 0,
          justification: b.justification || "",
          sort_order: b.sort_order || 0,
        })));
      }
    }
    load();
  }, [supabase, grantId]);

  const addItem = () => {
    setItems([...items, {
      category: "Personnel",
      description: "",
      amount: 0,
      justification: "",
      sort_order: items.length,
    }]);
  };

  const addExample = (ex: typeof EXAMPLE_CATEGORIES[0]) => {
    setItems([...items, {
      category: ex.category,
      description: ex.example,
      amount: ex.amount,
      justification: "",
      sort_order: items.length,
    }]);
  };

  const updateItem = (index: number, field: keyof BudgetItem, value: string | number) => {
    const updated = [...items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const saveBudget = useCallback(async () => {
    if (!applicationId) return;
    setSaving(true);

    // Delete existing items and re-insert
    await supabase.from("budget_items").delete().eq("application_id", applicationId);

    if (items.length > 0) {
      await supabase.from("budget_items").insert(
        items.map((item, i) => ({
          application_id: applicationId,
          category: item.category,
          description: item.description,
          amount: item.amount,
          justification: item.justification,
          sort_order: i,
        }))
      );
    }

    // Update application section status
    await supabase
      .from("application_sections")
      .update({ status: "verified", updated_at: new Date().toISOString() })
      .eq("application_id", applicationId)
      .eq("section_type", "budget");

    setSaving(false);
  }, [supabase, applicationId, items]);

  if (!grant) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <p className="text-warm-500">Grant not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-24">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-warm-200/40 shadow-sm">
        <div className="px-4 sm:px-6 py-3.5 flex items-center gap-3 max-w-3xl mx-auto">
          <Link href={`/apply/${grantId}`} className="text-warm-400 hover:text-warm-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-warm-900">Budget</h1>
            <p className="text-xs text-warm-400">{grant.name}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Example items */}
        <div className="bg-white border border-warm-200/80 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-warm-900 mb-2">Common line items</h2>
          <p className="text-xs text-warm-400 mb-4">
            Click to add — then adjust the amounts and descriptions for your center.
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_CATEGORIES.map((ex, i) => (
              <button
                key={i}
                onClick={() => addExample(ex)}
                className="text-xs bg-warm-50 border border-warm-200 rounded-lg px-3 py-1.5 text-warm-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition"
              >
                {ex.example} (${ex.amount.toLocaleString()})
              </button>
            ))}
          </div>
        </div>

        {/* Budget items */}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-white border border-warm-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={item.category}
                  onChange={(e) => updateItem(i, "category", e.target.value)}
                  className="bg-warm-50 border border-warm-200 rounded-lg px-3 py-1.5 text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="Personnel">Personnel</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Training">Training</option>
                  <option value="Travel">Travel</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Other">Other</option>
                </select>
                <button
                  onClick={() => removeItem(i)}
                  className="text-warm-400 hover:text-red-500 transition text-sm"
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Description (e.g., Lead Teacher salary, 0.5 FTE)"
                className="w-full bg-warm-50 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-warm-500 mb-1 block">Amount ($)</label>
                  <input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) => updateItem(i, "amount", Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-warm-50 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-xs text-warm-500 mb-1 block">Justification</label>
                  <input
                    type="text"
                    value={item.justification}
                    onChange={(e) => updateItem(i, "justification", e.target.value)}
                    placeholder="Why is this needed?"
                    className="w-full bg-warm-50 border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="w-full border-2 border-dashed border-warm-300 rounded-2xl py-4 text-sm font-semibold text-warm-500 hover:border-brand-400 hover:text-brand-600 transition"
        >
          + Add line item
        </button>

        {/* Total + crossfoot */}
        <div className="bg-white border border-warm-200/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-warm-900">Total Budget</span>
            <span className="text-xl font-extrabold text-warm-900">
              ${total.toLocaleString()}
            </span>
          </div>
          {grant.amount && (
            <p className="text-xs text-warm-400 mt-2">
              Grant maximum: {grant.amount}
            </p>
          )}
        </div>

        {/* Save */}
        <button
          onClick={saveBudget}
          disabled={saving || items.length === 0}
          className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white py-3.5 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save budget"}
        </button>
      </div>
    </div>
  );
}
