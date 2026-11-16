const fetch = require("node-fetch");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8001";

const requestExamGradingSuggestions = async (questions) => {
  const response = await fetch(`${AI_SERVICE_URL}/api/ai/exams/correction-suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions }),
    timeout: 70000,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || "Impossible de générer les suggestions de correction.");
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

module.exports = { requestExamGradingSuggestions };
