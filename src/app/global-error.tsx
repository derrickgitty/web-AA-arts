"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Quicksand, ui-sans-serif, system-ui, sans-serif",
          background: "#FFF9F0",
          color: "#374151",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "2.5rem",
            borderRadius: "1.5rem",
            maxWidth: "28rem",
            textAlign: "center",
            boxShadow: "0 8px 24px -8px rgba(255, 143, 184, 0.25)",
          }}
        >
          <h1 style={{ fontSize: "2rem", color: "#9B6FE0", marginBottom: "0.5rem" }}>
            Something broke
          </h1>
          <p style={{ color: "#6B7280", marginBottom: "1.5rem" }}>
            The whole page crashed. Try reloading.
          </p>
          <button
            onClick={reset}
            style={{
              background: "linear-gradient(to right, #FF8FB8, #B894F0)",
              color: "white",
              fontWeight: 700,
              padding: "0.75rem 1.25rem",
              borderRadius: "1rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
