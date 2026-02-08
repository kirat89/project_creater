"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Check,
  X as XIcon,
  Clock,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { API_ENUMS, apiUrl, assertRequiredString, isValidEnumValue } from "@/utils/backendApi";

export default function ItemExecutionPage({ params }) {
  const [item, setItem] = useState(null);
  const [execution, setExecution] = useState(null);
  const [stepExecutions, setStepExecutions] = useState([]);
  const [substeps, setSubsteps] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [newSubstepName, setNewSubstepName] = useState({});
  const [addingSubstep, setAddingSubstep] = useState({});
  const [newNote, setNewNote] = useState({});
  const [showNotes, setShowNotes] = useState({});

  useEffect(() => {
    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const response = await fetch(apiUrl(`/items/${params.id}`));
      if (response.ok) {
        const data = await response.json();
        setItem(data.item ? { ...data.item, item_type: data.item.item_type || data.item.type, item_status: data.item.item_status || data.item.status } : null);
        setExecution(data.execution ? { ...data.execution, execution_status: data.execution.execution_status || data.execution.status } : null);
        const steps = (data.steps || data.stepExecutions || []).map((step) => ({
          ...step,
          step_status: step.step_status || step.status,
        }));
        setStepExecutions(steps);
        const loadedSubsteps = (data.substeps || []).map((substep) => ({
          ...substep,
          substep_status: substep.substep_status || substep.status,
        }));
        setSubsteps(loadedSubsteps);

        // Fetch notes for each step
        if (data.execution) {
          for (const step of steps) {
            fetchNotesForStep(data.execution.id, step.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching item:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotesForStep = async (executionId, stepId) => {
    try {
      const response = await fetch(
        apiUrl(`/executions/${executionId}/steps/${stepId}/notes`),
      );
      if (response.ok) {
        const data = await response.json();
        setNotes((prev) => ({ ...prev, [stepId]: data.notes || [] }));
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const updateStepStatus = async (stepId, status) => {
    try {
      if (!isValidEnumValue(status, API_ENUMS.stepStatuses.filter((s) => s !== "pending"))) {
        throw new Error("Invalid step status");
      }
      const response = await fetch(
        apiUrl(`/executions/${execution.id}/steps/${stepId}`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        await fetchItem();

        // Check if all steps are completed
        const allDone = stepExecutions.every((s) =>
          s.id === stepId ? status === "done" : s.step_status === "done",
        );

        if (allDone && status === "done") {
          toast.success("🎉 Congratulations! All steps completed!", {
            description: `You finished "${item.title}"`,
            duration: 5000,
          });
        } else if (status === "done") {
          toast.success("Step completed!");
        }
      }
    } catch (error) {
      console.error("Error updating step:", error);
      toast.error("Failed to update step");
    }
  };

  const addNote = async (stepId) => {
    const noteText = newNote[stepId];
    if (!noteText || !noteText.trim()) return;

    try {
      const response = await fetch(
        apiUrl(`/executions/${execution.id}/steps/${stepId}/notes`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: noteText.trim() }),
        },
      );

      if (response.ok) {
        setNewNote({ ...newNote, [stepId]: "" });
        await fetchNotesForStep(execution.id, stepId);
        toast.success("Note added");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const formatDuration = (started, completed) => {
    if (!started || !completed) return null;
    const start = new Date(started);
    const end = new Date(completed);
    const diff = Math.floor((end - start) / 1000 / 60); // minutes

    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const addSubstep = async (stepId) => {
    const name = newSubstepName[stepId];
    if (!name || !name.trim()) return;

    setAddingSubstep({ ...addingSubstep, [stepId]: true });

    try {
      assertRequiredString(name.trim(), "substep name");
      const response = await fetch(
        apiUrl(`/executions/${execution.id}/steps/${stepId}/substeps`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        },
      );

      if (response.ok) {
        setNewSubstepName({ ...newSubstepName, [stepId]: "" });
        await fetchItem();
      }
    } catch (error) {
      console.error("Error adding substep:", error);
    } finally {
      setAddingSubstep({ ...addingSubstep, [stepId]: false });
    }
  };

  const toggleSubstep = async (stepId, substepId, currentStatus) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";

    try {
      if (!isValidEnumValue(newStatus, API_ENUMS.substepStatuses)) {
        throw new Error("Invalid substep status");
      }
      const response = await fetch(
        apiUrl(`/executions/${execution.id}/steps/${stepId}/substeps/${substepId}`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (response.ok) {
        await fetchItem();
      }
    } catch (error) {
      console.error("Error updating substep:", error);
    }
  };

  const getStepStatusIcon = (status) => {
    switch (status) {
      case "done":
        return <Check size={16} className="text-[#10B981]" />;
      case "active":
        return <Clock size={16} className="text-[#2563FF]" />;
      case "skipped":
        return <XIcon size={16} className="text-[#9B9B9B]" />;
      default:
        return null;
    }
  };

  const getStepStatusColor = (status) => {
    switch (status) {
      case "done":
        return "bg-[#D1FAE5] text-[#10B981] border-[#10B981]";
      case "active":
        return "bg-[#DBEAFE] text-[#2563FF] border-[#2563FF]";
      case "skipped":
        return "bg-[#F3F4F6] text-[#9B9B9B] border-[#9B9B9B]";
      default:
        return "bg-[#F9FAFB] text-[#6B7280] border-[#E5E5E5]";
    }
  };

  const completedSteps = stepExecutions.filter(
    (s) => s.step_status === "done",
  ).length;
  const totalSteps = stepExecutions.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#9B9B9B]">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#9B9B9B]">Item not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter text-[#2B2B2B] text-[13px] font-normal">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <div className="flex items-center gap-3">
              <a href="/items" className="p-2 hover:bg-[#F3F4F6] rounded">
                <ArrowLeft size={16} className="text-[#7A7A7A]" />
              </a>
              <div>
                <h1 className="text-[16px] font-semibold">{item.title}</h1>
                <div className="text-[11px] text-[#9B9B9B]">
                  {item.item_type} • {item.item_status.replace("_", " ")}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-[#EDEDED]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium">Overall Progress</span>
              <span className="text-[12px] text-[#7A7A7A]">
                {completedSteps} of {totalSteps} steps completed
              </span>
            </div>
            <div className="w-full h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563FF] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Steps List */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {stepExecutions.map((step, index) => {
                const stepSubsteps = substeps.filter(
                  (s) => s.step_execution_id === step.id,
                );
                const stepNotes = notes[step.id] || [];
                const canHaveSubsteps = step.can_have_substeps;
                const isActive = step.step_status === "active";
                const isDone = step.step_status === "done";
                const isPending = step.step_status === "pending";
                const duration = formatDuration(
                  step.started_at,
                  step.completed_at,
                );

                return (
                  <div
                    key={step.id}
                    className={`border rounded-xl overflow-hidden transition-all ${
                      isActive
                        ? "border-[#2563FF] shadow-sm"
                        : "border-[#E5E5E5]"
                    }`}
                  >
                    <div
                      className={`p-6 ${isActive ? "bg-[#F8FAFF]" : "bg-white"}`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold border-2 ${getStepStatusColor(step.step_status)}`}
                        >
                          {getStepStatusIcon(step.step_status) || index + 1}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-[15px] font-semibold mb-1">
                                {step.step_name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[11px] px-2 py-1 rounded ${getStepStatusColor(step.step_status)}`}
                                >
                                  {step.step_status}
                                </span>
                                {duration && (
                                  <span className="text-[11px] px-2 py-1 bg-[#F3F4F6] text-[#6B7280] rounded flex items-center gap-1">
                                    <Clock size={10} />
                                    {duration}
                                  </span>
                                )}
                                {stepNotes.length > 0 && (
                                  <button
                                    onClick={() =>
                                      setShowNotes({
                                        ...showNotes,
                                        [step.id]: !showNotes[step.id],
                                      })
                                    }
                                    className="text-[11px] px-2 py-1 bg-[#FEF3C7] text-[#F59E0B] rounded flex items-center gap-1 hover:bg-[#FDE68A]"
                                  >
                                    <MessageSquare size={10} />
                                    {stepNotes.length}
                                  </button>
                                )}
                              </div>
                            </div>

                            {isActive && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    updateStepStatus(step.id, "skipped")
                                  }
                                  className="h-8 px-4 border border-[#E5E5E5] rounded-lg text-[12px] font-medium text-[#7A7A7A] hover:border-[#9B9B9B]"
                                >
                                  Skip
                                </button>
                                <button
                                  onClick={() =>
                                    updateStepStatus(step.id, "done")
                                  }
                                  className="h-8 px-4 bg-[#2563FF] text-white rounded-lg text-[12px] font-semibold hover:bg-[#1D4ED8] flex items-center gap-1"
                                >
                                  <Check size={14} />
                                  Complete
                                </button>
                              </div>
                            )}

                            {isDone && (
                              <button
                                onClick={() =>
                                  updateStepStatus(step.id, "active")
                                }
                                className="h-8 px-4 border border-[#E5E5E5] rounded-lg text-[12px] font-medium text-[#7A7A7A] hover:border-[#2563FF]"
                              >
                                Reopen
                              </button>
                            )}
                          </div>

                          {/* Notes Section */}
                          {(isActive ||
                            stepNotes.length > 0 ||
                            showNotes[step.id]) && (
                            <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-[12px] font-semibold">
                                  Notes & Comments
                                </div>
                              </div>

                              {stepNotes.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  {stepNotes.map((note) => (
                                    <div
                                      key={note.id}
                                      className="bg-[#F9FAFB] border border-[#E5E5E5] rounded p-3"
                                    >
                                      <div className="text-[12px] text-[#2B2B2B] mb-1">
                                        {note.note}
                                      </div>
                                      <div className="text-[10px] text-[#9B9B9B]">
                                        {new Date(
                                          note.created_at,
                                        ).toLocaleString()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {isActive && (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newNote[step.id] || ""}
                                    onChange={(e) =>
                                      setNewNote({
                                        ...newNote,
                                        [step.id]: e.target.value,
                                      })
                                    }
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") addNote(step.id);
                                    }}
                                    placeholder="Add a note or comment..."
                                    className="flex-1 h-9 px-3 border border-[#E5E5E5] rounded text-[13px] outline-none focus:border-[#2563FF]"
                                  />
                                  <button
                                    onClick={() => addNote(step.id)}
                                    disabled={!newNote[step.id]}
                                    className="h-9 px-4 border border-[#E5E5E5] rounded text-[12px] font-medium text-[#7A7A7A] hover:border-[#2563FF] disabled:opacity-50"
                                  >
                                    Add Note
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Substeps */}
                          {canHaveSubsteps &&
                            (isActive || stepSubsteps.length > 0) && (
                              <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                                <div className="text-[12px] font-semibold mb-3">
                                  Substeps
                                </div>

                                {stepSubsteps.length > 0 && (
                                  <div className="space-y-2 mb-3">
                                    {stepSubsteps.map((substep) => (
                                      <div
                                        key={substep.id}
                                        className="flex items-center gap-2 py-2"
                                      >
                                        <button
                                          onClick={() =>
                                            toggleSubstep(
                                              step.id,
                                              substep.id,
                                              substep.substep_status,
                                            )
                                          }
                                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                            substep.substep_status === "done"
                                              ? "bg-[#2563FF] border-[#2563FF]"
                                              : "bg-white border-[#E5E5E5]"
                                          }`}
                                        >
                                          {substep.substep_status ===
                                            "done" && (
                                            <Check
                                              size={12}
                                              className="text-white"
                                            />
                                          )}
                                        </button>
                                        <span
                                          className={`text-[13px] ${
                                            substep.substep_status === "done"
                                              ? "line-through text-[#9B9B9B]"
                                              : "text-[#2B2B2B]"
                                          }`}
                                        >
                                          {substep.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {isActive && (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newSubstepName[step.id] || ""}
                                      onChange={(e) =>
                                        setNewSubstepName({
                                          ...newSubstepName,
                                          [step.id]: e.target.value,
                                        })
                                      }
                                      onKeyPress={(e) => {
                                        if (e.key === "Enter")
                                          addSubstep(step.id);
                                      }}
                                      placeholder="Add a substep..."
                                      className="flex-1 h-9 px-3 border border-[#E5E5E5] rounded text-[13px] outline-none focus:border-[#2563FF]"
                                    />
                                    <button
                                      onClick={() => addSubstep(step.id)}
                                      disabled={
                                        addingSubstep[step.id] ||
                                        !newSubstepName[step.id]
                                      }
                                      className="h-9 px-4 border border-[#E5E5E5] rounded text-[12px] font-medium text-[#7A7A7A] hover:border-[#2563FF] disabled:opacity-50"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-[300px] h-full border-l border-[#EDEDED] flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <span className="text-[14px] font-semibold">Details</span>
          </div>

          <div className="px-6 pt-6">
            <div className="space-y-4">
              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">Status</div>
                <div className="text-[14px] font-semibold capitalize">
                  {item.item_status.replace("_", " ")}
                </div>
              </div>

              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">Type</div>
                <div className="text-[14px] font-semibold capitalize">
                  {item.item_type}
                </div>
              </div>

              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">Progress</div>
                <div className="text-[24px] font-semibold">
                  {Math.round(progress)}%
                </div>
              </div>

              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">Created</div>
                <div className="text-[13px]">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div>
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Steps Overview
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Completed</span>
                    <span className="font-medium text-[#10B981]">
                      {
                        stepExecutions.filter((s) => s.step_status === "done")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Active</span>
                    <span className="font-medium text-[#2563FF]">
                      {
                        stepExecutions.filter((s) => s.step_status === "active")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Pending</span>
                    <span className="font-medium">
                      {
                        stepExecutions.filter(
                          (s) => s.step_status === "pending",
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
