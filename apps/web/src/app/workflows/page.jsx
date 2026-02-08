"use client";

import { useEffect, useState } from "react";
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
  Edit3,
} from "lucide-react";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchWorkflows();
  }, [filter]);

  const fetchWorkflows = async () => {
    try {
      const url =
        filter === "all" ? "/api/workflows" : `/api/workflows?type=${filter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const workflowTypes = [
    { value: "all", label: "All Types" },
    { value: "task", label: "Task" },
    { value: "product", label: "Product" },
    { value: "habit", label: "Habit" },
    { value: "generic", label: "Generic" },
  ];

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
              <div className="flex items-center justify-between h-[40px] text-[#2563FF] font-medium">
                <div className="flex items-center gap-3">
                  <GitBranch size={20} />
                  <span>Workflows</span>
                </div>
              </div>
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
                  placeholder="Search workflows..."
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
              <h1 className="text-[24px] font-semibold">Workflows</h1>
              <a
                href="/workflows/new"
                className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] inline-flex items-center"
              >
                <Plus size={14} className="mr-2" />
                Create Workflow
              </a>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
              {workflowTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium ${
                    filter === type.value
                      ? "bg-[#2563FF] text-white"
                      : "bg-[#F3F4F6] text-[#7A7A7A] hover:bg-[#E5E7EB]"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Workflows Grid */}
            {loading ? (
              <div className="text-center py-12 text-[#9B9B9B]">
                Loading workflows...
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[#9B9B9B] mb-4">No workflows yet</div>
                <a
                  href="/workflows/new"
                  className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] inline-flex items-center"
                >
                  Create Your First Workflow
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="bg-white border border-[#F1F1F1] rounded-xl p-6 hover:border-[#2563FF]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <a href={`/workflows/${workflow.id}`} className="flex-1">
                        <h3 className="text-[16px] font-semibold mb-2 hover:text-[#2563FF]">
                          {workflow.name}
                        </h3>
                        <p className="text-[13px] text-[#7A7A7A] line-clamp-2">
                          {workflow.description || "No description provided"}
                        </p>
                      </a>
                      <a
                        href={`/workflows/${workflow.id}/edit`}
                        className="ml-2 p-2 hover:bg-[#F3F4F6] rounded"
                      >
                        <Edit3 size={14} className="text-[#7A7A7A]" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-1 bg-[#EEF2FF] text-[#2563FF] rounded">
                        {workflow.workflow_type}
                      </span>
                      <span className="text-[11px] text-[#9B9B9B]">
                        v{workflow.current_version}
                      </span>
                      {workflow.is_active && (
                        <span className="text-[11px] px-2 py-1 bg-[#D1FAE5] text-[#10B981] rounded">
                          Active
                        </span>
                      )}
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
            <span className="text-[14px] font-semibold">Workflow Stats</span>
          </div>

          <div className="px-6 pt-6">
            <div className="space-y-4">
              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Total Workflows
                </div>
                <div className="text-[24px] font-semibold">
                  {workflows.length}
                </div>
              </div>

              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">By Type</div>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Task</span>
                    <span className="font-medium">
                      {
                        workflows.filter((w) => w.workflow_type === "task")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Product</span>
                    <span className="font-medium">
                      {
                        workflows.filter((w) => w.workflow_type === "product")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Habit</span>
                    <span className="font-medium">
                      {
                        workflows.filter((w) => w.workflow_type === "habit")
                          .length
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
