"use client";

import { useEffect, useState } from "react";
import { API_ENUMS, apiUrl, assertRequiredString, isValidEnumValue } from "@/utils/backendApi";
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";

export default function EditWorkflowPage({ params }) {
  const [workflow, setWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newStep, setNewStep] = useState({
    name: "",
    description: "",
    step_type: "manual",
    can_have_substeps: false,
    is_required: true,
    estimated_minutes: null,
  });

  useEffect(() => {
    if (params.id) {
      fetchWorkflow();
    }
  }, [params.id]);

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(apiUrl(`/workflows/${params.id}`));
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow);
        setSteps(data.steps || []);
        setName(data.workflow.name);
        setDescription(data.workflow.description || "");
      }
    } catch (error) {
      console.error("Error fetching workflow:", error);
      toast.error("Failed to load workflow");
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflow = async () => {
    setSaving(true);
    try {
      assertRequiredString(name, "name");

      const response = await fetch(apiUrl(`/workflows/${params.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        toast.success("Workflow updated successfully");
      } else {
        throw new Error("Failed to update workflow");
      }
    } catch (error) {
      console.error("Error updating workflow:", error);
      toast.error("Failed to update workflow");
    } finally {
      setSaving(false);
    }
  };

  const addStep = async () => {
    if (!newStep.name) {
      toast.error("Step name is required");
      return;
    }

    try {
      assertRequiredString(newStep.name, "step.name");
      if (!isValidEnumValue(newStep.step_type, API_ENUMS.stepTypes)) {
        throw new Error("Invalid step type");
      }

      const response = await fetch(apiUrl(`/steps`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newStep, workflow_id: params.id }),
      });

      if (response.ok) {
        toast.success("Step added successfully");
        setNewStep({
          name: "",
          description: "",
          step_type: "manual",
          can_have_substeps: false,
          is_required: true,
          estimated_minutes: null,
        });
        await fetchWorkflow();
      } else {
        throw new Error("Failed to add step");
      }
    } catch (error) {
      console.error("Error adding step:", error);
      toast.error("Failed to add step");
    }
  };

  const deleteStep = async (stepId) => {
    if (!confirm("Are you sure you want to delete this step?")) return;

    try {
      const response = await fetch(
        apiUrl(`/steps/${stepId}`),
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("Step deleted successfully");
        await fetchWorkflow();
      } else {
        throw new Error("Failed to delete step");
      }
    } catch (error) {
      console.error("Error deleting step:", error);
      toast.error("Failed to delete step");
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
              <a
                href={`/workflows/${params.id}`}
                className="p-2 hover:bg-[#F3F4F6] rounded"
              >
                <ArrowLeft size={16} className="text-[#7A7A7A]" />
              </a>
              <div>
                <h1 className="text-[16px] font-semibold">Edit Workflow</h1>
                <div className="text-[11px] text-[#9B9B9B]">{workflow.name}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={updateWorkflow}
                disabled={saving}
                className="h-10 px-6 border border-[#E5E5E5] rounded-lg text-[13px] font-medium text-[#7A7A7A] hover:border-[#2563FF] flex items-center gap-2"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Basic Info */}
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-8">
                <h2 className="text-[16px] font-semibold mb-6">
                  Workflow Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      rows={3}
                      className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Existing Steps */}
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-8">
                <h2 className="text-[16px] font-semibold mb-6">
                  Workflow Steps ({steps.length})
                </h2>

                {steps.length === 0 ? (
                  <div className="text-center py-8 text-[#9B9B9B]">
                    No steps yet. Add your first step below.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="border border-[#E5E5E5] rounded-lg p-5 flex items-start gap-4"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-[#EEF2FF] text-[#2563FF] rounded-full flex items-center justify-center text-[13px] font-semibold">
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-[14px] font-semibold mb-1">
                                {step.name}
                              </h3>
                              {step.description && (
                                <p className="text-[12px] text-[#7A7A7A] mb-2">
                                  {step.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteStep(step.id)}
                              className="p-2 hover:bg-[#FEE2E2] rounded text-[#DC2626]"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[11px] px-2 py-1 rounded ${getStepTypeColor(step.step_type)}`}
                            >
                              {step.step_type}
                            </span>
                            {step.can_have_substeps && (
                              <span className="text-[11px] px-2 py-1 bg-[#F3F4F6] text-[#6B7280] rounded">
                                Substeps enabled
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
                            {step.estimated_minutes && (
                              <span className="text-[11px] px-2 py-1 bg-[#FEF3C7] text-[#F59E0B] rounded">
                                ~{step.estimated_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Step */}
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-8">
                <h2 className="text-[16px] font-semibold mb-6">Add New Step</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium mb-2">
                        Step Name *
                      </label>
                      <input
                        type="text"
                        value={newStep.name}
                        onChange={(e) =>
                          setNewStep({ ...newStep, name: e.target.value })
                        }
                        placeholder="e.g., Research Requirements"
                        className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium mb-2">
                        Step Type
                      </label>
                      <select
                        value={newStep.step_type}
                        onChange={(e) =>
                          setNewStep({ ...newStep, step_type: e.target.value })
                        }
                        className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                      >
                        <option value="manual">Manual</option>
                        <option value="checklist">Checklist</option>
                        <option value="approval">Approval</option>
                        <option value="timer">Timer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={newStep.description}
                      onChange={(e) =>
                        setNewStep({ ...newStep, description: e.target.value })
                      }
                      rows={2}
                      placeholder="Describe what needs to be done in this step..."
                      className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium mb-2">
                        Estimated Time (min)
                      </label>
                      <input
                        type="number"
                        value={newStep.estimated_minutes || ""}
                        onChange={(e) =>
                          setNewStep({
                            ...newStep,
                            estimated_minutes: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                        placeholder="30"
                        className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 h-10">
                        <input
                          type="checkbox"
                          checked={newStep.can_have_substeps}
                          onChange={(e) =>
                            setNewStep({
                              ...newStep,
                              can_have_substeps: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-[13px]">Allow substeps</span>
                      </label>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 h-10">
                        <input
                          type="checkbox"
                          checked={newStep.is_required}
                          onChange={(e) =>
                            setNewStep({
                              ...newStep,
                              is_required: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-[13px]">Required step</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={addStep}
                    className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add Step
                  </button>
                </div>
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
              <div className="pt-4 border-t border-[#F6F6F6]">
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Total Steps
                </div>
                <div className="text-[20px] font-semibold">{steps.length}</div>
              </div>

              <div>
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Estimated Time
                </div>
                <div className="text-[20px] font-semibold">
                  {steps.reduce(
                    (sum, s) => sum + (s.estimated_minutes || 0),
                    0,
                  )}{" "}
                  min
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
