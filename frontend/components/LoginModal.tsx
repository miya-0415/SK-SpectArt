type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
  onOpenSignup: () => void;
};

export function LoginModal({ open, onClose, onLogin, onOpenSignup }: LoginModalProps) {
  return (
    <div className="modal-overlay" id="login-modal" style={{ display: open ? "flex" : "none" }}>
      <div className="modal-box">
        <img src="/logo/Spectart-Logo.svg" alt="logo" className="modal-logo" />

        <p className="modal-message">作品を保存・編集するにはログインが必要です</p>

        <input type="email" placeholder="メールアドレス" className="modal-input" />

        <input type="password" placeholder="パスワード" className="modal-input" />

        <button className="modal-main-btn" onClick={onLogin}>
          ログイン
        </button>

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
