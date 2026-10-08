// lib/utils.js
export function formatDate(dateString) {
  // format date nicely
  // example: from this 👉 2025-05-20 to this 👉 May 20, 2025
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
// App is INR-only: formatINR(-1234.5) → "₹1,234.5"
export function formatINR(amount) {
  return `₹${Math.abs(Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
