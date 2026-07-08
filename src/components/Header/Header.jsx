import useAppStore from "../../store/appStore";
import { isCloudEnabled } from "../../services/cloudService";

const STATUS_LABELS = {
    loading: "Загрузка...",
    saving: "Сохранение...",
    saved: "Синхронизировано",
    offline: "Только локально",
    error: "Ошибка синхронизации",
    idle: ""
};

function Header() {
    const {
        syncStatus,
        authRequired,
        authUser,
        logout
    } = useAppStore();

    const cloudOn = isCloudEnabled();
    const label = STATUS_LABELS[syncStatus] || "";

    return (
        <header className="header">
            <h4>Маршрутная карта, для логистов.</h4>

            <div className="header__actions">
                {label && (
                    <span className={`sync-badge sync-badge--${syncStatus}`}>
                        {cloudOn ? "☁️" : "💾"} {label}
                    </span>
                )}

                {authRequired && authUser && (
                    <span className="auth-badge auth-badge--user">
                        👤 {authUser}
                    </span>
                )}

                {authRequired && (
                    <button
                        type="button"
                        className="auth-btn auth-btn--logout"
                        onClick={logout}
                    >
                        Выйти
                    </button>
                )}
            </div>
        </header>
    );
}

export default Header;
