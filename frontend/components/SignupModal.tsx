type SignupModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SignupModal({ open, onClose }: SignupModalProps) {
  return (
    <div className="modal-overlay" id="signup-modal" style={{ display: open ? "flex" : "none" }}>
      <div className="modal-box">
        <img src="/logo/Spectart-Logo.svg" alt="logo" className="modal-logo" />

        <p className="modal-message">E-mailでアカウント登録</p>

        <input type="email" placeholder="メールアドレス" className="modal-input" />

        <input type="password" placeholder="パスワード" className="modal-input" />

        <button className="modal-main-btn">アカウント登録</button>

        <div className="modal-divider">または</div>

        <button className="modal-sub-btn">Continue with Google</button>

        <button className="modal-close" id="close-signup" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </div>
  );
}
