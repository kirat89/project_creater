"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Edit3, GitBranch, Plus } from "lucide-react";

export default function WorkflowDetailPage({ params }) {
  const [workflow, setWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchWorkflow();
    }
  }, [params.id]);

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflows/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow);
        setSteps(data.steps || []);
      }
    } catch (error) {
      console.error("Error fetching workflow:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStepTypeColor = (type) => {
    switch (type) {
      case "manual":
        return "bg-[#DBEAFE] text-[#2563FF]";
      case "checklist":
        return "bg-[#D1FAE5] text-[#10B981]";
      case "approval":
        return "bg-[#FEF3C7] text-[#F59E0B]";
      case "timer":
        return "bg-[#FCE7F3] text-[#EC4899]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#9B9B9B]">Loading...</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#9B9B9B]">Workflow not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter text-[#2B2B2B] text-[13px] font-normal">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <div className="flex items-center gap-3">
              <a href="/workflows" className="p-2 hover:bg-[#F3F4F6] rounded">
                <ArrowLeft size={16} className="text-[#7A7A7A]" />
              </a>
              <div>
                <h1 className="text-[16px] font-semibold">{workflow.name}</h1>
                <div className="text-[11px] text-[#9B9B9B]">
                  {workflow.workflow_type} • v{workflow.current_version}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  (window.location.href = `/workflows/${workflow.id}/edit`)
                }
                className="h-10 px-6 border border-[#E5E5E5] rounded-lg text-[13px] font-medium text-[#7A7A7A] flex items-center gap-2 hover:border-[#2563FF]"
              >
                <Edit3 size={14} />
                Edit
              </button>
              <button
                onClick={() => (window.location.href = "/items/new")}
                className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] flex items-center gap-2"
              >
                <Plus size={14} />
                Use This Workflow
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* Workflow Info */}
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-8 mb-6">
                <h2 className="text-[16px] font-semibold mb-4">Description</h2>
                <p className="text-[13px] text-[#7A7A7A]">
                  {workflow.description || "No description provided"}
                </p>

                <div className="flex gap-4 mt-6 pt-6 border-t border-[#F1F1F1]">
                  <div>
                    <div className="text-[11px] text-[#7A7A7A] mb-1">Type</div>
                    <span className="text-[11px] px-2 py-1 bg-[#EEF2FF] text-[#2563FF] rounded capitalize">
                      {workflow.workflow_type}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#7A7A7A] mb-1">
                      Version
                    </div>
                    <span className="text-[13px] font-medium">
                      v{workflow.current_version}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#7A7A7A] mb-1">
                      Status
                    </div>
                    <span
                      className={`text-[11px] px-2 py-1 rounded ${
                        workflow.is_active
                          ? "bg-[#D1FAE5] text-[#10B981]"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      {workflow.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#7A7A7A] mb-1">
                      Total Steps
                    </div>
                    <span className="text-[13px] font-medium">
                      {steps.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-8">
                <h2 className="text-[16px] font-semibold mb-6">
                  Workflow Steps
                </h2>

                {steps.length === 0 ? (
                  <div className="text-center py-8 text-[#9B9B9B]">
                    No steps defined for this workflow
                  </div>
                ) : (
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="border border-[#E5E5E5] rounded-lg p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-[#EEF2FF] text-[#2563FF] rounded-full flex items-center justify-center text-[13px] font-semibold">
                            {index + 1}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-[14px] font-semibold mb-2">
                                  {step.name}
                                </h3>
                                {step.description && (
                                  <p className="text-[12px] text-[#7A7A7A] mb-3">
                                    {step.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] px-2 py-1 rounded ${getStepTypeColor(step.step_type)}`}
                              >
                                {step.step_type}
                              </span>
                              {step.can_have_substeps && (
                                <span className="text-[11px] px-2 py-1 bg-[#F3F4F6] text-[#6B7280] rounded">
                                  Can have substeps
                                </span>
                              )}
                              {step.is_required ? (
                                <span className="text-[11px] px-2 py-1 bg-[#FEE2E2] text-[#DC2626] rounded">
                                  Required
                                </span>
                              ) : (
                                <span className="text-[11px] px-2 py-1 bg-[#F3F4F6] text-[#6B7280] rounded">
                                  Optional
                                </span>
                              )}
                            </div>
                          </div>
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
            <span className="text-[14px] font-semibold">Workflow Info</span>
          </div>

          <div className="px-6 pt-6">
            <div className="space-y-4">
              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">Created</div>
                <div className="text-[13px]">
                  {new Date(workflow.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Step Types
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Manual</span>
                    <span className="font-medium">
                      {steps.filter((s) => s.step_type === "manual").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Checklist</span>
                    <span className="font-medium">
                      {steps.filter((s) => s.step_type === "checklist").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Approval</span>
                    <span className="font-medium">
                      {steps.filter((s) => s.step_type === "approval").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Timer</span>
                    <span className="font-medium">
                      {steps.filter((s) => s.step_type === "timer").length}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Quick Actions
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => (window.location.href = "/items/new")}
                    className="w-full h-9 px-4 bg-[#2563FF] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1D4ED8] flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    Create Item
                  </button>
                  <button
                    onClick={() =>
                      (window.location.href = `/workflows/${workflow.id}/edit`)
                    }
                    className="w-full h-9 px-4 border border-[#E5E5E5] text-[12px] font-medium text-[#7A7A7A] rounded-lg hover:border-[#2563FF] flex items-center justify-center gap-2"
                  >
                    <Edit3 size={14} />
                    Edit Workflow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
