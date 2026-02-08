"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/utils/backendApi";
import {
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  Plus,
  LayoutDashboard,
  GitBranch,
  CheckSquare,
  Settings,
  ChevronRight,
  Calendar,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: "",
    workflow_id: null,
    frequency: "daily",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [habitsRes, workflowsRes] = await Promise.all([
        fetch(apiUrl("/items?type=habit")),
        fetch(apiUrl("/workflows?type=habit")),
      ]);

      if (habitsRes.ok) {
        const data = await habitsRes.json();
        setHabits((data.items || []).map((item) => ({ ...item, item_type: item.item_type || item.type, item_status: item.item_status || item.status })));
      }

      if (workflowsRes.ok) {
        const data = await workflowsRes.json();
        setWorkflows((data.workflows || []).map((workflow) => ({ ...workflow, workflow_type: workflow.workflow_type || workflow.type })));
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async () => {
    if (!newHabit.title || !newHabit.workflow_id) {
      toast.error("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(apiUrl("/items"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newHabit.title,
          item_type: "habit",
          workflow_id: newHabit.workflow_id,
          frequency: newHabit.frequency,
        }),
      });

      if (response.ok) {
        const { item } = await response.json();
        toast.success("Habit created!");
        setShowCreateModal(false);
        setNewHabit({ title: "", workflow_id: null, frequency: "daily" });
        await fetchData();
        window.location.href = `/items/${item.id}`;
      } else {
        throw new Error("Failed to create habit");
      }
    } catch (error) {
      console.error("Error creating habit:", error);
      toast.error("Failed to create habit");
    } finally {
      setCreating(false);
    }
  };

  const getNextScheduled = (lastExecuted, frequency) => {
    if (!lastExecuted) return "Today";

    const last = new Date(lastExecuted);
    const now = new Date();

    switch (frequency) {
      case "daily":
        last.setDate(last.getDate() + 1);
        break;
      case "weekly":
        last.setDate(last.getDate() + 7);
        break;
      case "monthly":
        last.setMonth(last.getMonth() + 1);
        break;
    }

    if (last <= now) return "Today";
    return last.toLocaleDateString();
  };

  const getStreak = (habit) => {
    // This would need more sophisticated calculation based on execution history
    return habit.streak || 0;
  };

  return (
    <div className="min-h-screen bg-white font-inter text-[#2B2B2B] text-[13px] font-normal">
      <div className="flex h-screen">
        {/* Left Navigation */}
        <div className="w-[230px] h-full border-r border-[#EDEDED] flex flex-col">
          <div className="h-[56px] flex items-center justify-between px-4 border-b border-[#EDEDED]">
            <div className="h-[56px] flex items-center gap-2">
              <Menu size={20} className="text-[#5C5C5C]" />
              <span className="text-[14px] font-medium text-[#5C5C5C]">
                Menu
              </span>
            </div>
            <X size={14} className="text-[#9B9B9B]" />
          </div>

          <div className="flex-1 px-4 pt-4">
            <a
              href="/"
              className="flex items-center gap-3 h-[40px] text-[#7A7A7A] font-medium hover:text-[#2563FF]"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>

            <div className="mt-6">
              <a
                href="/workflows"
                className="flex items-center justify-between h-[40px] text-[#7A7A7A] font-medium hover:text-[#2563FF]"
              >
                <div className="flex items-center gap-3">
                  <GitBranch size={20} />
                  <span>Workflows</span>
                </div>
                <ChevronRight size={12} className="text-[#BFC2C8]" />
              </a>
            </div>

            <div className="mt-6">
              <a
                href="/items"
                className="flex items-center justify-between h-[40px] text-[#7A7A7A] font-medium hover:text-[#2563FF]"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare size={20} />
                  <span>Items</span>
                </div>
                <ChevronRight size={12} className="text-[#BFC2C8]" />
              </a>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between h-[40px] text-[#2563FF] font-medium">
                <div className="flex items-center gap-3">
                  <Calendar size={20} />
                  <span>Habits</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between h-[40px] text-[#7A7A7A] font-medium">
                <div className="flex items-center gap-3">
                  <Settings size={20} />
                  <span>Settings</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-[640px] flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <div className="relative max-w-[360px] flex-1">
              <div className="flex items-center h-[40px] px-4 border border-[#E5E5E5] rounded-full">
                <Search size={16} className="text-[#C3C3C3] mr-3" />
                <input
                  type="text"
                  placeholder="Search habits..."
                  className="flex-1 text-[14px] text-[#A3A3A3] bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="w-6 h-6 border-4 border-[#2563FF] rounded-full"></div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2563FF] text-white rounded-full flex items-center justify-center text-[14px] font-medium">
                  U
                </div>
                <span className="text-[13px] font-medium text-[#4C4C4C]">
                  User
                </span>
                <ChevronDown size={12} className="text-[#C3C3C3]" />
              </div>
              <Bell size={12} className="text-[#C3C3C3]" />
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[24px] font-semibold">Habits</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] inline-flex items-center"
              >
                <Plus size={14} className="mr-2" />
                Create Habit
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-[#9B9B9B]">
                Loading habits...
              </div>
            ) : habits.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto mb-4 text-[#E5E5E5]" />
                <div className="text-[#9B9B9B] mb-4">No habits yet</div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] inline-flex items-center"
                >
                  Create Your First Habit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() =>
                      (window.location.href = `/items/${habit.id}`)
                    }
                    className="bg-white border border-[#F1F1F1] rounded-xl p-6 hover:border-[#2563FF] cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-[16px] font-semibold">
                        {habit.title}
                      </h3>
                      {getStreak(habit) > 0 && (
                        <div className="flex items-center gap-1 text-[#F59E0B]">
                          <Flame size={14} />
                          <span className="text-[12px] font-semibold">
                            {getStreak(habit)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-[11px] text-[#7A7A7A]">
                        Frequency
                      </div>
                      <div className="text-[13px] font-medium capitalize">
                        {habit.frequency || "daily"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] text-[#7A7A7A]">
                        Next Scheduled
                      </div>
                      <div className="text-[13px] font-medium">
                        {getNextScheduled(
                          habit.last_executed_at,
                          habit.frequency || "daily",
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#F1F1F1]">
                      <div
                        className={`text-[11px] px-2 py-1 rounded inline-block ${
                          habit.item_status === "completed"
                            ? "bg-[#D1FAE5] text-[#10B981]"
                            : "bg-[#DBEAFE] text-[#2563FF]"
                        }`}
                      >
                        {habit.item_status === "completed"
                          ? "Completed Today"
                          : "Ready to Start"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[300px] h-full border-l border-[#EDEDED] flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <span className="text-[14px] font-semibold">Habit Stats</span>
          </div>

          <div className="px-6 pt-6">
            <div className="space-y-4">
              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Total Habits
                </div>
                <div className="text-[24px] font-semibold">{habits.length}</div>
              </div>

              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  By Frequency
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Daily</span>
                    <span className="font-medium">
                      {habits.filter((h) => h.frequency === "daily").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Weekly</span>
                    <span className="font-medium">
                      {habits.filter((h) => h.frequency === "weekly").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Monthly</span>
                    <span className="font-medium">
                      {habits.filter((h) => h.frequency === "monthly").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-[20px] font-semibold mb-6">Create New Habit</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium mb-2">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={newHabit.title}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, title: e.target.value })
                  }
                  placeholder="e.g., Morning Meditation"
                  className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-2">
                  Workflow *
                </label>
                <select
                  value={newHabit.workflow_id || ""}
                  onChange={(e) =>
                    setNewHabit({
                      ...newHabit,
                      workflow_id: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                >
                  <option value="">Select a workflow</option>
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-2">
                  Frequency *
                </label>
                <select
                  value={newHabit.frequency}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, frequency: e.target.value })
                  }
                  className="w-full h-10 px-4 border border-[#E5E5E5] rounded-lg text-[13px] outline-none focus:border-[#2563FF]"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 h-10 border border-[#E5E5E5] rounded-lg text-[13px] font-medium text-[#7A7A7A]"
              >
                Cancel
              </button>
              <button
                onClick={createHabit}
                disabled={creating}
                className="flex-1 h-10 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] disabled:bg-[#9B9B9B]"
              >
                {creating ? "Creating..." : "Create Habit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
