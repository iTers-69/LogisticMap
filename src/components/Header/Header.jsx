import useAppStore from "../../store/appStore";
import SidebarTabs from "../Sidebar/SidebarTabs";

function Header() {
    const {
        authRequired,
        authUser,
        logout
    } = useAppStore();

    return (
        <header className="header">
            <SidebarTabs />

            <div className="header__actions">
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
