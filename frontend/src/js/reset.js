import { resetPasswordController } from "./controller.js";

const form = document.getElementById("resetPasswordForm");
const newPass = document.getElementById("newPassword");
const confirmPass = document.getElementById("confirmPassword");
const errorDiv = document.getElementById("reset-error");

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

if (!token) {
    errorDiv.textContent = "Invalid reset link. No token provided.";
    form.style.display = "none";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = newPass.value;
    const confirmPassword = confirmPass.value;
    if (!newPassword || newPassword.length < 8) {
        errorDiv.textContent = "Password must be at least 8 characters";
        return;
    }
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = "Passwords do not match";
        return;
    }
    errorDiv.textContent = "";
    const btn = document.getElementById("resetPasswordBtn");
    btn.disabled = true;
    btn.innerHTML = "Resetting...";
    try {
        await resetPasswordController(token, newPassword);
        errorDiv.textContent = "Password reset successfully. Redirecting to login...";
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
    } catch (err) {
        errorDiv.textContent = err.message || "Error resetting password";
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Reset Password";
    }
});