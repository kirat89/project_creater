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
} from "lucide-react";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, workflowsRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/workflows"),
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);
      }

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData.workflows || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const inProgressItems = items.filter(
    (item) => item.item_status === "in_progress",
  );
  const completedItems = items.filter(
    (item) => item.item_status === "completed",
  );

  return (
    <div className="min-h-screen bg-white font-inter text-[#2B2B2B] text-[13px] font-normal">
      <div className="flex h-screen">
        {/* Left Navigation Rail - 230px */}
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
              className="flex items-center gap-3 h-[40px] text-[#2563FF] font-medium"
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
              <div className="flex items-center justify-between h-[40px] text-[#7A7A7A] font-medium">
                <div className="flex items-center gap-3">
                  <Settings size={20} />
                  <span>Settings</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 min-w-[640px] flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <div className="relative max-w-[360px] flex-1">
              <div className="flex items-center h-[40px] px-4 border border-[#E5E5E5] rounded-full">
                <Search size={16} className="text-[#C3C3C3] mr-3" />
                <input
                  type="text"
                  placeholder="Search items and workflows..."
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
              <h1 className="text-[24px] font-semibold">Dashboard</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-6">
                <div className="text-[#7A7A7A] text-[12px] mb-2">
                  Total Items
                </div>
                <div className="text-[32px] font-semibold text-[#2B2B2B]">
                  {items.length}
                </div>
              </div>
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-6">
                <div className="text-[#7A7A7A] text-[12px] mb-2">
                  In Progress
                </div>
                <div className="text-[32px] font-semibold text-[#2563FF]">
                  {inProgressItems.length}
                </div>
              </div>
              <div className="bg-white border border-[#F1F1F1] rounded-xl p-6">
                <div className="text-[#7A7A7A] text-[12px] mb-2">Completed</div>
                <div className="text-[32px] font-semibold text-[#10B981]">
                  {completedItems.length}
                </div>
              </div>
            </div>

            {/* Active Items */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-semibold">Active Items</h2>
                <a
                  href="/items/new"
                  className="h-8 px-4 border border-[#E5E5E5] rounded-full text-[13px] font-medium text-[#7A7A7A] flex items-center gap-1 hover:border-[#2563FF] hover:text-[#2563FF]"
                >
                  <Plus size={12} />
                  New Item
                </a>
              </div>

              <div className="bg-white border border-[#F1F1F1] rounded-xl p-6">
                {loading ? (
                  <div className="text-center py-8 text-[#9B9B9B]">
                    Loading...
                  </div>
                ) : inProgressItems.length === 0 ? (
                  <div className="text-center py-8 text-[#9B9B9B]">
                    No active items. Create your first item to get started!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inProgressItems.slice(0, 5).map((item) => (
                      <a
                        key={item.id}
                        href={`/items/${item.id}`}
                        className="flex items-center justify-between h-10 hover:bg-[#F9FAFB] px-3 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-[#2563FF] rounded-full"></div>
                          <span className="font-medium">{item.title}</span>
                          <span className="text-[#9B9B9B] text-[11px] px-2 py-1 bg-[#F3F4F6] rounded">
                            {item.item_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-[11px] text-[#7A7A7A]">
                            {item.completed_steps || 0}/{item.total_steps || 0}{" "}
                            steps
                          </div>
                          <div className="w-16 h-1 bg-[#E5E5E5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2563FF] rounded-full"
                              style={{
                                width: `${item.total_steps > 0 ? (item.completed_steps / item.total_steps) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Workflows */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-semibold">Your Workflows</h2>
                <a
                  href="/workflows/new"
                  className="h-8 px-4 border border-[#E5E5E5] rounded-full text-[13px] font-medium text-[#7A7A7A] flex items-center gap-1 hover:border-[#2563FF] hover:text-[#2563FF]"
                >
                  <Plus size={12} />
                  New Workflow
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {workflows.slice(0, 4).map((workflow) => (
                  <a
                    key={workflow.id}
                    href={`/workflows/${workflow.id}`}
                    className="bg-white border border-[#F1F1F1] rounded-xl p-6 hover:border-[#2563FF] block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-[14px] font-semibold">
                        {workflow.name}
                      </h3>
                      <span className="text-[11px] text-[#9B9B9B] px-2 py-1 bg-[#F3F4F6] rounded">
                        {workflow.workflow_type}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#7A7A7A] line-clamp-2">
                      {workflow.description || "No description"}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-[300px] h-full border-l border-[#EDEDED] flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED] bg-white">
            <span className="text-[14px] font-semibold">Quick Stats</span>
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
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Completion Rate
                </div>
                <div className="text-[24px] font-semibold">
                  {items.length > 0
                    ? Math.round((completedItems.length / items.length) * 100)
                    : 0}
                  %
                </div>
              </div>

              <div>
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Recent Activity
                </div>
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex gap-2 py-2">
                    <div className="w-1 h-1 bg-[#2563FF] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-[12px] font-medium">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#9B9B9B]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
