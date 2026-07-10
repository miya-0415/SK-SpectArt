"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  onSignupSuccess: () => void;
};

export function SignupModal({ open, onClose, onSignupSuccess }: SignupModalProps) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password);
      await login(email, password);
      setPassword("");
      setConfirmPassword("");
      onSignupSuccess();
    } catch {
      setError("アカウントの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" id="signup-modal" style={{ display: open ? "flex" : "none" }}>
      <div className="modal-box">
        <img src="/logo/Spectart-Logo.svg" alt="logo" className="modal-logo" />

        <p className="modal-message">E-mailでアカウント登録</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="メールアドレス"
            className="modal-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="パスワード"
            className="modal-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />

          <input
            type="password"
            placeholder="パスワード（確認）"
            className="modal-input"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button className="modal-main-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "アカウント登録"}
          </button>
        </form>

        <div className="modal-divider">または</div>

        <button className="modal-sub-btn">Continue with Google</button>

        <button className="modal-close" id="close-signup" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </div>
  );
}
