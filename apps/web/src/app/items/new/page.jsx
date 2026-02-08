"use client";

import { useEffect, useState } from "react";
import { API_ENUMS, apiUrl, assertRequiredString, isValidEnumValue } from "@/utils/backendApi";
import { Plus, ArrowLeft } from "lucide-react";

export default function NewItemPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [itemType, setItemType] = useState("task");
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch(apiUrl("/workflows"));
      if (response.ok) {
        const data = await response.json();
        setWorkflows((data.workflows || []).map((workflow) => ({ ...workflow, workflow_type: workflow.workflow_type || workflow.type })));
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async () => {
    if (!title) {
      setError("Please enter a title for your item");
      return;
    }

    if (!selectedWorkflow) {
      setError("Please select a workflow");
      return;
    }

    setCreating(true);
    setError("");

    try {
      assertRequiredString(title, "title");
      if (!isValidEnumValue(itemType, API_ENUMS.itemTypes)) {
        throw new Error("Invalid item type");
      }

      const response = await fetch(apiUrl("/items"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          item_type: itemType,
          workflow_id: selectedWorkflow.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create item");
      }

      const { item } = await response.json();
      window.location.href = `/items/${item.id}`;
    } catch (err) {
      console.error("Error creating item:", err);
      setError(err.message || "Failed to create item. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const filteredWorkflows = workflows.filter(
    (w) => itemType === "all" || w.workflow_type === itemType,
  );

  return (
    <div className="min-h-screen bg-white font-inter text-[#2B2B2B] text-[13px] font-normal">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <div className="flex items-center gap-3">
              <a href="/items" className="p-2 hover:bg-[#F3F4F6] rounded">
                <ArrowLeft size={16} className="text-[#7A7A7A]" />
              </a>
              <h1 className="text-[20px] font-semibold">Create New Item</h1>
            </div>
            <div className="flex gap-3">
              <a
                href="/items"
                className="h-10 px-6 border border-[#E5E5E5] rounded-lg text-[13px] font-medium text-[#7A7A7A] flex items-center"
              >
                Cancel
              </a>
              <button
                onClick={createItem}
                disabled={creating || !title || !selectedWorkflow}
                className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] disabled:bg-[#9B9B9B] flex items-center gap-2"
              >
                <Plus size={14} />
                {creating ? "Creating..." : "Create Item"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            {error && (
              <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg text-[#DC2626] max-w-4xl mx-auto">
                {error}
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              {/* Item Details */}
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-8 mb-6">
                <h2 className="text-[16px] font-semibold mb-6">Item Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Item Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Build User Authentication"
                      className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Item Type *
                    </label>
                    <select
                      value={itemType}
                      onChange={(e) => {
                        setItemType(e.target.value);
                        setSelectedWorkflow(null);
                      }}
                      className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                    >
                      <option value="task">Task</option>
                      <option value="product">Product</option>
                      <option value="habit">Habit</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Select Workflow */}
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-8">
                <h2 className="text-[16px] font-semibold mb-6">
                  Select Workflow *
                  {selectedWorkflow && (
                    <span className="ml-3 text-[13px] font-normal text-[#2563FF]">
                      Selected: {selectedWorkflow.name}
                    </span>
                  )}
                </h2>

                {loading ? (
                  <div className="text-center py-8 text-[#9B9B9B]">
                    Loading workflows...
                  </div>
                ) : filteredWorkflows.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-[#9B9B9B] mb-4">
                      No workflows available for {itemType} type
                    </div>
                    <a
                      href="/workflows/new"
                      className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] inline-flex items-center"
                    >
                      Create a Workflow First
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredWorkflows.map((workflow) => (
                      <div
                        key={workflow.id}
                        onClick={() => setSelectedWorkflow(workflow)}
                        className={`border rounded-xl p-6 cursor-pointer transition-all ${
                          selectedWorkflow?.id === workflow.id
                            ? "border-[#2563FF] bg-[#EEF2FF]"
                            : "border-[#E5E5E5] hover:border-[#2563FF]"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-[14px] font-semibold">
                            {workflow.name}
                          </h3>
                          {selectedWorkflow?.id === workflow.id && (
                            <div className="w-5 h-5 bg-[#2563FF] rounded-full flex items-center justify-center">
                              <svg
                                width="12"
                                height="10"
                                viewBox="0 0 12 10"
                                fill="none"
                              >
                                <path
                                  d="M1 5L4.5 8.5L11 1.5"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-[12px] text-[#7A7A7A] mb-3 line-clamp-2">
                          {workflow.description || "No description provided"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2 py-1 bg-white text-[#2563FF] rounded border border-[#2563FF]">
                            {workflow.workflow_type}
                          </span>
                          <span className="text-[11px] text-[#9B9B9B]">
                            v{workflow.current_version}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-[300px] h-full border-l border-[#EDEDED] flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <span className="text-[14px] font-semibold">How It Works</span>
          </div>

          <div className="px-6 pt-6">
            <div className="space-y-4">
              <div>
                <div className="text-[12px] font-semibold mb-2">
                  1. Name Your Item
                </div>
                <div className="text-[12px] text-[#7A7A7A]">
                  Give your item a descriptive title so you can track it easily.
                </div>
              </div>

              <div>
                <div className="text-[12px] font-semibold mb-2">
                  2. Choose Item Type
                </div>
                <div className="text-[12px] text-[#7A7A7A]">
                  Select whether this is a task, product, or habit.
                </div>
              </div>

              <div>
                <div className="text-[12px] font-semibold mb-2">
                  3. Select Workflow
                </div>
                <div className="text-[12px] text-[#7A7A7A]">
                  Pick a workflow template that matches your item type. The
                  workflow defines the steps you'll follow.
                </div>
              </div>

              <div className="pt-4 border-t border-[#F6F6F6]">
                <div className="text-[11px] text-[#9B9B9B]">
                  Once created, you'll be able to work through each step of the
                  workflow, add substeps, and track your progress.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
