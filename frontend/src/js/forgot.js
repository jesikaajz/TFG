import { forgotPasswordController } from "./controller.js";

const form = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("forgotEmail");
const errorDiv = document.getElementById("forgot-error");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
        errorDiv.textContent = "Please enter your email";
        return;
    }
    errorDiv.textContent = "";
    const btn = document.getElementById("sendResetLinkBtn");
    btn.disabled = true;
    btn.innerHTML = "Sending...";
    try {
        await forgotPasswordController(email);
        errorDiv.textContent = "If the email exists, a reset link has been sent.";
        setTimeout(() => {
            window.location.href = "login.html";
        }, 3000);
    } catch (err) {
        errorDiv.textContent = err.message || "Error sending reset link";
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Send Reset Link";
    }
});