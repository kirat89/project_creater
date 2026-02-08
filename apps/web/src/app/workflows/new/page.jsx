"use client";

import { useState } from "react";
import { Menu, X, Plus, Trash2, Save } from "lucide-react";
import {
  API_ENUMS,
  apiUrl,
  assertMaxLength,
  assertRequiredString,
  isValidEnumValue,
} from "@/utils/backendApi";

export default function NewWorkflowPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workflowType, setWorkflowType] = useState("task");
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addStep = () => {
    setSteps([
      ...steps,
      {
        name: "",
        description: "",
        step_type: "manual",
        can_have_substeps: false,
        is_required: true,
        tempId: Date.now(),
      },
    ]);
  };

  const removeStep = (tempId) => {
    setSteps(steps.filter((s) => s.tempId !== tempId));
  };

  const updateStep = (tempId, field, value) => {
    setSteps(
      steps.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s)),
    );
  };

  const saveWorkflow = async () => {
    if (!name || !workflowType) {
      setError("Name and type are required");
      return;
    }

    if (!isValidEnumValue(workflowType, API_ENUMS.workflowTypes)) {
      setError("Invalid workflow type");
      return;
    }

    if (steps.length === 0) {
      setError("Add at least one step to your workflow");
      return;
    }

    const invalidSteps = steps.filter((s) => !s.name || !s.step_type);
    if (invalidSteps.length > 0) {
      setError("All steps must have a name and type");
      return;
    }

    setSaving(true);
    setError("");

    try {
      assertRequiredString(name, "name");
      assertMaxLength(name, "name", 200);
      assertMaxLength(description, "description", 2000);

      const workflowRes = await fetch(apiUrl("/workflows"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          workflow_type: workflowType,
        }),
      });

      if (!workflowRes.ok) throw new Error("Failed to create workflow");

      const { workflow } = await workflowRes.json();

      for (const step of steps) {
        if (!isValidEnumValue(step.step_type, API_ENUMS.stepTypes)) {
          throw new Error("Invalid step type");
        }

        await fetch(apiUrl(`/steps`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflow_id: workflow.id,
            name: step.name,
            description: step.description,
            step_type: step.step_type,
            can_have_substeps: step.can_have_substeps,
            is_required: step.is_required,
          }),
        });
      }

      window.location.href = `/workflows/${workflow.id}`;
    } catch (err) {
      console.error("Error saving workflow:", err);
      setError("Failed to save workflow. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-inter text-[#2B2B2B] text-[13px] font-normal">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <h1 className="text-[20px] font-semibold">Create New Workflow</h1>
            <div className="flex gap-3">
              <a
                href="/workflows"
                className="h-10 px-6 border border-[#E5E5E5] rounded-lg text-[13px] font-medium text-[#7A7A7A]"
              >
                Cancel
              </a>
              <button
                onClick={saveWorkflow}
                disabled={saving}
                className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] disabled:bg-[#9B9B9B] flex items-center gap-2"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save & Publish"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            {error && (
              <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg text-[#DC2626]">
                {error}
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-8 mb-6">
                <h2 className="text-[16px] font-semibold mb-6">
                  Workflow Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Workflow Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Build Backend Feature"
                      className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what this workflow is for..."
                      className="w-full h-20 px-4 py-2 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Workflow Type *
                    </label>
                    <select
                      value={workflowType}
                      onChange={(e) => setWorkflowType(e.target.value)}
                      className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                    >
                      <option value="task">Task</option>
                      <option value="product">Product</option>
                      <option value="habit">Habit</option>
                      <option value="generic">Generic</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#F1F1F1] rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[16px] font-semibold">Workflow Steps</h2>
                  <button
                    onClick={addStep}
                    className="h-8 px-4 border border-[#E5E5E5] rounded-lg text-[13px] font-medium text-[#7A7A7A] flex items-center gap-1 hover:border-[#2563FF] hover:text-[#2563FF]"
                  >
                    <Plus size={12} />
                    Add Step
                  </button>
                </div>

                {steps.length === 0 ? (
                  <div className="text-center py-8 text-[#9B9B9B]">
                    No steps yet. Click "Add Step" to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div
                        key={step.tempId}
                        className="border border-[#E5E5E5] rounded-lg p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-[#EEF2FF] text-[#2563FF] rounded-full flex items-center justify-center text-[13px] font-semibold">
                            {index + 1}
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <input
                                  type="text"
                                  value={step.name}
                                  onChange={(e) =>
                                    updateStep(
                                      step.tempId,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Step name *"
                                  className="w-full h-9 px-3 border border-[#E5E5E5] rounded text-[13px] outline-none focus:border-[#2563FF]"
                                />
                              </div>
                              <div>
                                <select
                                  value={step.step_type}
                                  onChange={(e) =>
                                    updateStep(
                                      step.tempId,
                                      "step_type",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-9 px-3 border border-[#E5E5E5] rounded text-[13px] outline-none focus:border-[#2563FF]"
                                >
                                  <option value="manual">Manual</option>
                                  <option value="checklist">Checklist</option>
                                  <option value="approval">Approval</option>
                                  <option value="timer">Timer</option>
                                </select>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={step.description}
                              onChange={(e) =>
                                updateStep(
                                  step.tempId,
                                  "description",
                                  e.target.value,
                                )
                              }
                              placeholder="Step description (optional)"
                              className="w-full h-9 px-3 border border-[#E5E5E5] rounded text-[13px] outline-none focus:border-[#2563FF]"
                            />

                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 text-[12px]">
                                <input
                                  type="checkbox"
                                  checked={step.can_have_substeps}
                                  onChange={(e) =>
                                    updateStep(
                                      step.tempId,
                                      "can_have_substeps",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-4 h-4"
                                />
                                Can have substeps
                              </label>
                              <label className="flex items-center gap-2 text-[12px]">
                                <input
                                  type="checkbox"
                                  checked={step.is_required}
                                  onChange={(e) =>
                                    updateStep(
                                      step.tempId,
                                      "is_required",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-4 h-4"
                                />
                                Required
                              </label>
                            </div>
                          </div>

                          <button
                            onClick={() => removeStep(step.tempId)}
                            className="flex-shrink-0 p-2 hover:bg-[#FEE2E2] rounded"
                          >
                            <Trash2 size={14} className="text-[#DC2626]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
