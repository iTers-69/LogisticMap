import { useState } from "react";

function LoginScreen({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = onLogin(username, password, remember);

        setLoading(false);

        if (!result.ok) {
            setError(result.error || "Ошибка входа");
        }
    };

    return (
        <div className="login-screen">
            <div className="login-screen__card">
                <div className="login-screen__brand">LogisticMap</div>
                <h1 className="login-screen__title">Маршрутная карта для логистов</h1>
                <p className="login-screen__hint">
                    Введите логин и пароль, чтобы открыть карту и начать работу с маршрутами.
                </p>

                <form onSubmit={handleSubmit} className="login-screen__form">
                    <label className="auth-modal__label" htmlFor="auth-login">
                        Логин
                    </label>
                    <input
                        id="auth-login"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Логин"
                        autoComplete="username"
                        autoFocus
                        className="auth-modal__input"
                    />

                    <label className="auth-modal__label" htmlFor="auth-password">
                        Пароль
                    </label>
                    <input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Пароль"
                        autoComplete="current-password"
                        className="auth-modal__input"
                    />

                    <label className="auth-modal__remember">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                        />
                        Запомнить на этом устройстве
                    </label>

                    {error && <p className="auth-modal__error">{error}</p>}

                    <button
                        type="submit"
                        className="login-screen__submit"
                        disabled={loading || !username || !password}
                    >
                        {loading ? "Вход..." : "Войти"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginScreen;
