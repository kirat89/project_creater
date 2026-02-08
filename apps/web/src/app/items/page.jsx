"use client";

import { useEffect, useState } from "react";
import { API_ENUMS, apiUrl, isValidEnumValue } from "@/utils/backendApi";
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

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    try {
      const url =
        filter === "all" ? apiUrl("/items") : apiUrl(`/items?type=${filter}`);
      if (filter !== "all" && !isValidEnumValue(filter, API_ENUMS.itemTypes)) {
        throw new Error("Invalid item type filter");
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setItems((data.items || []).map((item) => ({ ...item, item_type: item.item_type || item.type, item_status: item.item_status || item.status })));
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const itemTypes = [
    { value: "all", label: "All Items" },
    { value: "task", label: "Tasks" },
    { value: "product", label: "Products" },
    { value: "habit", label: "Habits" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-[#D1FAE5] text-[#10B981]";
      case "in_progress":
        return "bg-[#DBEAFE] text-[#2563FF]";
      case "not_started":
        return "bg-[#F3F4F6] text-[#6B7280]";
      default:
        return "bg-[#FEE2E2] text-[#DC2626]";
    }
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
              <div className="flex items-center justify-between h-[40px] text-[#2563FF] font-medium">
                <div className="flex items-center gap-3">
                  <CheckSquare size={20} />
                  <span>Items</span>
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
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              <h1 className="text-[24px] font-semibold">Items</h1>
              <a
                href="/items/new"
                className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] inline-flex items-center"
              >
                <Plus size={14} className="mr-2" />
                Create Item
              </a>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
              {itemTypes.map((type) => (
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

            {/* Items List */}
            {loading ? (
              <div className="text-center py-12 text-[#9B9B9B]">
                Loading items...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[#9B9B9B] mb-4">
                  {searchQuery ? "No items match your search" : "No items yet"}
                </div>
                <a
                  href="/items/new"
                  className="h-10 px-6 bg-[#2563FF] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] inline-flex items-center"
                >
                  Create Your First Item
                </a>
              </div>
            ) : (
              <div className="bg-white border border-[#F1F1F1] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F1F1F1] bg-[#F9FAFB]">
                      <th className="text-left px-6 py-4 text-[12px] font-semibold text-[#6B7280]">
                        TITLE
                      </th>
                      <th className="text-left px-6 py-4 text-[12px] font-semibold text-[#6B7280]">
                        TYPE
                      </th>
                      <th className="text-left px-6 py-4 text-[12px] font-semibold text-[#6B7280]">
                        STATUS
                      </th>
                      <th className="text-left px-6 py-4 text-[12px] font-semibold text-[#6B7280]">
                        PROGRESS
                      </th>
                      <th className="text-left px-6 py-4 text-[12px] font-semibold text-[#6B7280]">
                        CREATED
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#F1F1F1] hover:bg-[#F9FAFB] cursor-pointer"
                        onClick={() =>
                          (window.location.href = `/items/${item.id}`)
                        }
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium">{item.title}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] px-2 py-1 bg-[#F3F4F6] text-[#6B7280] rounded">
                            {item.item_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[11px] px-2 py-1 rounded ${getStatusColor(item.item_status)}`}
                          >
                            {item.item_status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#2563FF] rounded-full"
                                style={{
                                  width: `${item.total_steps > 0 ? (item.completed_steps / item.total_steps) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-[11px] text-[#7A7A7A]">
                              {item.completed_steps || 0}/
                              {item.total_steps || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#7A7A7A]">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[300px] h-full border-l border-[#EDEDED] flex flex-col">
          <div className="h-[64px] flex items-center justify-between px-6 border-b border-[#EDEDED]">
            <span className="text-[14px] font-semibold">Item Stats</span>
          </div>

          <div className="px-6 pt-6">
            <div className="space-y-4">
              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">
                  Total Items
                </div>
                <div className="text-[24px] font-semibold">
                  {filteredItems.length}
                </div>
              </div>

              <div className="border-b border-[#F6F6F6] pb-4">
                <div className="text-[12px] text-[#7A7A7A] mb-2">By Status</div>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">In Progress</span>
                    <span className="font-medium">
                      {
                        filteredItems.filter(
                          (i) => i.item_status === "in_progress",
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Completed</span>
                    <span className="font-medium">
                      {
                        filteredItems.filter(
                          (i) => i.item_status === "completed",
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#7A7A7A]">Not Started</span>
                    <span className="font-medium">
                      {
                        filteredItems.filter(
                          (i) => i.item_status === "not_started",
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
