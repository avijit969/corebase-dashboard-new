export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
    constructor(public message: string, public status: number, public code?: string) {
        super(message);
        this.name = "ApiError";
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = "An error occurred";
        let errorCode = "UNKNOWN_ERROR";
        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error.message || errorMessage;
                errorCode = errorData.error.code || errorCode;
            }
        } catch {
            // If parsing JSON fails, fallback to status text
            errorMessage = response.statusText;
        }
        throw new ApiError(errorMessage, response.status, errorCode);
    }
    const data = await response.json();
    return data.data; // API returns { status: 'success', data: ... }
}

function handleAuthFailure() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem("platform_token");
        localStorage.removeItem("platform_refresh_token");
        window.location.href = "/platform/login";
    }
}

async function fetchWithPlatformAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const isBrowser = typeof window !== 'undefined';
    let token = isBrowser ? localStorage.getItem("platform_token") : null;

    const headers = new Headers(options.headers || {});
    if (headers.has("Authorization")) {
        const authHeader = headers.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
    } else if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401 && isBrowser) {
        const refreshToken = localStorage.getItem("platform_refresh_token");
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_BASE_URL}/platform/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${refreshToken}` }
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    if (data?.data?.access_token) {
                        localStorage.setItem("platform_token", data.data.access_token);
                        if (data.data.refresh_token) {
                            localStorage.setItem("platform_refresh_token", data.data.refresh_token);
                        }

                        // Retry original request
                        headers.set("Authorization", `Bearer ${data.data.access_token}`);
                        response = await fetch(url, { ...options, headers });
                    } else {
                        handleAuthFailure();
                    }
                } else {
                    handleAuthFailure();
                }
            } catch (err) {
                handleAuthFailure();
            }
        } else {
            handleAuthFailure();
        }
    }

    return response;
}

export const api = {
    auth: {
        signup: async (email: string, password: string, name: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/platform/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name }),
            });
            return handleResponse(res);
        },
        login: async (email: string, password: string): Promise<{ access_token: string; expires_in: number }> => {
            const res = await fetch(`${API_BASE_URL}/platform/auth/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            return handleResponse(res);
        },
        me: async (token: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/platform/auth/user`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            return handleResponse(res);
        },
    },
    projects: {
        create: async (name: string, token: string, orgId?: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, ...(orgId ? { org_id: orgId } : {}) }),
            });
            return handleResponse(res);
        },
        list: async (token: string, orgId?: string): Promise<any> => {
            const url = orgId ? `${API_BASE_URL}/projects?org_id=${orgId}` : `${API_BASE_URL}/projects`;
            const res = await fetchWithPlatformAuth(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return handleResponse(res);
        },
        get: async (id: string, token: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/projects/${id}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return handleResponse(res);
        },
        delete: async (id: string, token: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/projects/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return handleResponse(res);
        },
        update: async (id: string, token: string, data: any): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/projects/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        updateAuthConfig: async (projectId: string, token: string, config: any): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/auth/project/auth/config?projectId=${projectId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(config),
            });
            return handleResponse(res);
        },
        getUsers: async (id: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/projects/${id}/users`, {
                method: "GET",
            });
            return handleResponse(res);
        }
    },
    db: {
        listTables: async (apiKey: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/db/tables`, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        createTable: async (apiKey: string, schema: any): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/db/tables`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(schema),
            });
            return handleResponse(res);
        },
        getTable: async (apiKey: string, tableName: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/db/tables/${tableName}`, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        deleteTable: async (apiKey: string, tableName: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/db/tables/${tableName}`, {
                method: "DELETE",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        addColumn: async (apiKey: string, tableName: string, columnDef: any): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/db/tables/${tableName}/columns`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(columnDef),
            });
            return handleResponse(res);
        },
        updateColumn: async (apiKey: string, tableName: string, columnName: string, columnDef: any): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/db/tables/${tableName}/columns/${columnName}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(columnDef),
            });
            return handleResponse(res);
        },
        deleteColumn: async (apiKey: string, tableName: string, columnName: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/db/tables/${tableName}/columns/${columnName}`, {
                method: "DELETE",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        addForeignKey: async (apiKey: string, tableName: string, fkDef: any): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/db/tables/${tableName}/foreign-keys`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(fkDef),
            });
            return handleResponse(res);
        }
    },
    storage: {
        listBuckets: async (apiKey: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/storage/buckets`, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        createBucket: async (apiKey: string, bucketDef: { name: string; public: boolean; allowedMimeTypes?: string[]; fileSizeLimit?: number }): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/storage/buckets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(bucketDef),
            });
            return handleResponse(res);
        },
        getBucket: async (apiKey: string, name: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/storage/buckets/${name}`, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        deleteBucket: async (apiKey: string, name: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/storage/buckets/${name}`, {
                method: "DELETE",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        emptyBucket: async (apiKey: string, name: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/storage/buckets/${name}/empty`, {
                method: "POST",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        listFiles: async (apiKey: string, bucketName?: string): Promise<any> => {
            const url = bucketName
                ? `${API_BASE_URL}/storage/files?bucket=${bucketName}`
                : `${API_BASE_URL}/storage/files`;
            const res = await fetch(url, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        getUploadUrl: async (apiKey: string, fileData: { bucketName: string; filename: string; contentType: string; size: number }): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/storage/upload/sign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(fileData),
            });
            return handleResponse(res);
        },
        deleteFile: async (apiKey: string, fileId: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/storage/files/${fileId}`, {
                method: "DELETE",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        }
    },
    tableOperations: {
        insert: async (apiKey: string, tableName: string, data: any): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/table_operation/insert/${tableName}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        update: async (apiKey: string, tableName: string, data: { updates: any; where: any }): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/table_operation/update/${tableName}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        delete: async (apiKey: string, tableName: string, where: any): Promise<any> => {
            // Check if where IS the body or wrapped in where property based on API docs (body: { where: { ... } })
            const body = { where };
            const res = await fetch(`${API_BASE_URL}/table_operation/delete/${tableName}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(body),
            });
            return handleResponse(res);
        },
        select: async (apiKey: string, tableName: string, query?: any): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/table_operation/select/${tableName}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(query || {}),
            });
            return handleResponse(res);
        }
    },
    cron: {
        create: async (apiKey: string, data: any): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/cron`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey
                },
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        list: async (apiKey: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/cron`, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        get: async (apiKey: string, id: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/cron/${id}`, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        delete: async (apiKey: string, id: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/cron/${id}`, {
                method: "DELETE",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        listExecutions: async (apiKey: string, id: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/cron/${id}/executions`, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        getExecution: async (apiKey: string, id: string, executionId: string): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/cron/${id}/executions/${executionId}`, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });
            return handleResponse(res);
        },
        update: async (apiKey: string, id: string, data: any): Promise<any> => {
            const res = await fetch(`${API_BASE_URL}/cron/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey },
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        }
    },
    teams: {
        create: async (token: string, name: string, orgId?: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, ...(orgId ? { org_id: orgId } : {}) }),
            });
            return handleResponse(res);
        },
        list: async (token: string, orgId?: string): Promise<any> => {
            const url = orgId ? `${API_BASE_URL}/teams?org_id=${orgId}` : `${API_BASE_URL}/teams`;
            const res = await fetchWithPlatformAuth(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
        get: async (token: string, teamId: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams/${teamId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
        update: async (token: string, teamId: string, name: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams/${teamId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name }),
            });
            return handleResponse(res);
        },
        delete: async (token: string, teamId: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams/${teamId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
        addMember: async (token: string, teamId: string, email: string, role: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams/${teamId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email, role }),
            });
            return handleResponse(res);
        },
        updateMember: async (token: string, teamId: string, userId: string, role: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams/${teamId}/members/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ role }),
            });
            return handleResponse(res);
        },
        removeMember: async (token: string, teamId: string, userId: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams/${teamId}/members/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
        listProjects: async (token: string, teamId: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams/${teamId}/projects`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
        assignProject: async (token: string, teamId: string, projectId: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams/${teamId}/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ project_id: projectId }),
            });
            return handleResponse(res);
        },
        removeProject: async (token: string, teamId: string, projectId: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/teams/${teamId}/projects/${projectId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
    },
    orgs: {
        create: async (token: string, name: string, slug: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/orgs`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, slug }),
            });
            return handleResponse(res);
        },
        list: async (token: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/orgs`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
        get: async (token: string, orgId: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/orgs/${orgId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
        update: async (token: string, orgId: string, data: { name: string; slug?: string }): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/orgs/${orgId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        delete: async (token: string, orgId: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/orgs/${orgId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
        addMember: async (token: string, orgId: string, email: string, role: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/orgs/${orgId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email, role }),
            });
            return handleResponse(res);
        },
        updateMember: async (token: string, orgId: string, userId: string, role: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/orgs/${orgId}/members/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ role }),
            });
            return handleResponse(res);
        },
        removeMember: async (token: string, orgId: string, userId: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/orgs/${orgId}/members/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            return handleResponse(res);
        },
    },
    customEmail: {
        create: async (apiKey: string, data: { name: string; subject: string; body: string }): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/custom-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        list: async (apiKey: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/custom-email`, {
                method: "GET",
                headers: {
                    "x-api-key": apiKey,
                },
            });
            return handleResponse(res);
        },
        get: async (apiKey: string, id: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/custom-email/${id}`, {
                method: "GET",
                headers: {
                    "x-api-key": apiKey,
                },
            });
            return handleResponse(res);
        },
        update: async (apiKey: string, id: string, data: { name?: string; subject?: string; body?: string }): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/custom-email/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },
        delete: async (apiKey: string, id: string): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/custom-email/${id}`, {
                method: "DELETE",
                headers: {
                    "x-api-key": apiKey,
                },
            });
            return handleResponse(res);
        },
        send: async (apiKey: string, id: string, data: { to: string; name: string; projectName: string }): Promise<any> => {
            const res = await fetchWithPlatformAuth(`${API_BASE_URL}/custom-email/${id}/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        }
    }
};
