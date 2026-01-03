/**
 * Register Page.
 * 
 * User registration interface with email and password.
 */

import { useState, FormEvent } from "react";
import { useAuth } from "../features/auth/auth.hooks.js";
import { EmailInput, PasswordInput, Button } from "@repo/ui";

export function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validate passwords match
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    // Validate password strength (basic check)
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }

    try {
      await register({ 
        email, 
        password,
        issueSession: true // Automatically log in after registration
      });
      
      // Redirect after successful registration
      window.location.href = "/";
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h1>Register</h1>
      
      {(error || localError) && (
        <div style={{ 
          padding: "10px", 
          marginBottom: "20px", 
          backgroundColor: "#fee", 
          border: "1px solid #fcc",
          borderRadius: "4px",
          color: "#c00"
        }}>
          {error || localError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <EmailInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            disabled={loading}
          />
          <small style={{ color: "#666", fontSize: "0.85em" }}>
            Minimum 8 characters
          </small>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Creating account..." : "Register"}
        </Button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#0066cc" }}>
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
