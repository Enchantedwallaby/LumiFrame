const API_BASE_URL = "http://127.0.0.1:5000"; // Flask backend

// Generic function for GET requests
export async function apiGet(endpoint, token = null) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return await res.json();
}

// Generic function for POST requests (handles file uploads too)
export async function apiPost(endpoint, data, isForm = false, token = null) {
  const options = {
    method: "POST",
    headers: {},
    body: isForm ? data : JSON.stringify(data),
  };

  if (!isForm) {
    options.headers["Content-Type"] = "application/json";
  }

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
  return await res.json();
}

// Generic function for DELETE requests
export async function apiDelete(endpoint, token = null, photographerKey = null) {
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (photographerKey) {
    headers["X-Photographer-Key"] = photographerKey;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers,
  });
  return await res.json();
}

// Function to delete a user account
export async function apiDeleteUser(username, photographerKey) {
  return await apiDelete(`/delete_user/${username}`, null, photographerKey);
}
