import React, { Component, ReactNode } from "react";
import { RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--paper)",
          color: "var(--ink)",
          padding: "40px 20px",
          fontFamily: "var(--sans)",
        }}>
          <div style={{
            maxWidth: "600px",
            width: "100%",
            border: "1px solid var(--line)",
            padding: "32px",
            background: "white",
            textAlign: "center"
          }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "28px", margin: "0 0 16px" }}>
              Something interrupted the lesson.
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px" }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="primary-button"
              style={{ margin: "0 auto" }}
            >
              <RotateCcw size={16} /> Return to lesson
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
