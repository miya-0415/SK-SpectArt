"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onOpenSignup: () => void;
};

export function LoginModal({ open, onClose, onLoginSuccess, onOpenSignup }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      setPassword("");
      onLoginSuccess();
    } catch {
      setError("メールアドレスまたはパスワードが正しくありません");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" id="login-modal" style={{ display: open ? "flex" : "none" }}>
      <div className="modal-box">
        <img src="/logo/Spectart-Logo.svg" alt="logo" className="modal-logo" />

        <p className="modal-message">作品を保存・編集するにはログインが必要です</p>

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
          />

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button className="modal-main-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <a href="#" className="forgot-password" onClick={(event) => event.preventDefault()}>
          パスワードを忘れた場合
        </a>

        <button className="modal-sub-btn" id="open-signup" onClick={onOpenSignup}>
          新しいアカウントを作成
        </button>

        <button className="modal-close" id="close-login" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </div>
  );
}
