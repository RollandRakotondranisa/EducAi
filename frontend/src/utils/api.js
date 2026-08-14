const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;

  const { body, headers = {}, signal, ...rest } = options;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: options.credentials ?? "same-origin",
    body: body ? JSON.stringify(body) : undefined,
    signal,
    ...rest,
  });

  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = { message: text };
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || "Server error");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export default apiFetch;
