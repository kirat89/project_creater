/**
 * API Client for backend communication
 * Handles authentication headers, error handling, and request formatting
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

/**
 * Fetches from the backend API with proper headers
 */
export async function apiCall(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any
) {
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (data && (method === "POST" || method === "PUT")) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(error.detail || error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Workflows API
 */
export const workflowsAPI = {
    async list(type?: string) {
        const params = type ? `?type=${type}` : "";
        return apiCall(`/workflows${params}`);
    },

    async get(id: string) {
        return apiCall(`/workflows/${id}`);
    },

    async create(data: any) {
        return apiCall("/workflows", "POST", data);
    },

    async update(id: string, data: any) {
        return apiCall(`/workflows/${id}`, "PUT", data);
    },

    async delete(id: string) {
        return apiCall(`/workflows/${id}`, "DELETE");
    },
};

/**
 * Items API
 */
export const itemsAPI = {
    async list(type?: string, status?: string) {
        const params = new URLSearchParams();
        if (type) params.append("type", type);
        if (status) params.append("status", status);
        const queryString = params.toString();
        return apiCall(`/items${queryString ? "?" + queryString : ""}`);
    },

    async get(id: string) {
        return apiCall(`/items/${id}`);
    },

    async create(data: any) {
        return apiCall("/items", "POST", data);
    },

    async update(id: string, data: any) {
        return apiCall(`/items/${id}`, "PUT", data);
    },

    async delete(id: string) {
        return apiCall(`/items/${id}`, "DELETE");
    },
};

/**
 * Steps API
 */
export const stepsAPI = {
    async list(workflowId: string) {
        return apiCall(`/steps?workflow_id=${workflowId}`);
    },

    async get(id: string) {
        return apiCall(`/steps/${id}`);
    },

    async create(data: any) {
        return apiCall("/steps", "POST", data);
    },

    async update(id: string, data: any) {
        return apiCall(`/steps/${id}`, "PUT", data);
    },

    async delete(id: string) {
        return apiCall(`/steps/${id}`, "DELETE");
    },
};

/**
 * Authentication API
 */
export const authAPI = {
    async signup(email: string, password: string, name?: string) {
        const response = await apiCall("/auth/signup", "POST", { email, password, name });
        if (response.user) {
            return response.user;
        }
        throw new Error("Signup failed");
    },

    async login(email: string, password: string) {
        const response = await apiCall("/auth/login", "POST", { email, password });
        if (response.access_token) {
            localStorage.setItem("access_token", response.access_token);
            return response;
        }
        throw new Error("Login failed");
    },

    async getCurrentUser() {
        const response = await apiCall("/auth/me");
        return response.user;
    },

    async logout() {
        localStorage.removeItem("access_token");
        await apiCall("/auth/logout", "POST");
    },
};

/**
 * Step Execution API
 */
export const executionsAPI = {
    async getSteps(executionId: string) {
        return apiCall(`/executions/${executionId}/steps`);
    },

    async updateStepStatus(executionId: string, stepId: string, status: string) {
        return apiCall(`/executions/${executionId}/steps/${stepId}`, "PUT", { status });
    },

    async addSubstep(executionId: string, stepId: string, name: string) {
        return apiCall(
            `/executions/${executionId}/steps/${stepId}/substeps`,
            "POST",
            { name }
        );
    },

    async getSubsteps(executionId: string, stepId: string) {
        return apiCall(`/executions/${executionId}/steps/${stepId}/substeps`);
    },

    async updateSubstepStatus(
        executionId: string,
        stepId: string,
        substepId: string,
        status: string
    ) {
        return apiCall(
            `/executions/${executionId}/steps/${stepId}/substeps/${substepId}`,
            "PUT",
            { status }
        );
    },

    async deleteSubstep(
        executionId: string,
        stepId: string,
        substepId: string
    ) {
        return apiCall(
            `/executions/${executionId}/steps/${stepId}/substeps/${substepId}`,
            "DELETE"
        );
    },
};

export default {
    workflowsAPI,
    itemsAPI,
    stepsAPI,
    authAPI,
    executionsAPI,
};
