const AUTH_KEY = "logisticmap_authed";
const AUTH_USER_KEY = "logisticmap_user";

function getExpectedLogin() {
    return import.meta.env.VITE_APP_LOGIN?.trim() || "logist";
}

function getExpectedPassword() {
    return import.meta.env.VITE_APP_PASSWORD?.trim() || "";
}

export function isAuthRequired() {
    return Boolean(getExpectedPassword());
}

export function isAuthenticated() {
    if (!isAuthRequired()) return true;
    return sessionStorage.getItem(AUTH_KEY) === "1"
        || localStorage.getItem(AUTH_KEY) === "1";
}

export function getAuthUser() {
    if (!isAuthenticated()) return null;
    return sessionStorage.getItem(AUTH_USER_KEY)
        || localStorage.getItem(AUTH_USER_KEY)
        || getExpectedLogin();
}

export function canEditData() {
    return !isAuthRequired() || isAuthenticated();
}

export function login(username, password, remember = false) {
    const expectedLogin = getExpectedLogin();
    const expectedPassword = getExpectedPassword();

    if (!expectedPassword) {
        return { ok: true, user: username?.trim() || expectedLogin };
    }

    const loginOk = username?.trim().toLowerCase() === expectedLogin.toLowerCase();
    const passwordOk = password?.trim() === expectedPassword;

    if (!loginOk || !passwordOk) {
        return { ok: false, error: "Неверный логин или пароль" };
    }

    const userName = username.trim();

    sessionStorage.setItem(AUTH_KEY, "1");
    sessionStorage.setItem(AUTH_USER_KEY, userName);

    if (remember) {
        localStorage.setItem(AUTH_KEY, "1");
        localStorage.setItem(AUTH_USER_KEY, userName);
    } else {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
    }

    return { ok: true, user: userName };
}

export function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}
