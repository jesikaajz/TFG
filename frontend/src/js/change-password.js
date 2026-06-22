import { confirmChangePasswordController2 } from "./controller.js";

// Verificar que el usuario está autenticado (tiene token)
const token = localStorage.getItem("access_token");
if (!token) {
    // No hay token, redirigir al login
    window.location.href = "login.html";
}

const form = document.getElementById("changePasswordForm");
const errorDiv = document.getElementById("change-error");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    
    errorDiv.textContent = "";
    
    if (!currentPassword || !newPassword) {
        errorDiv.textContent = "Please fill all fields";
        return;
    }
    
    if (newPassword.length < 8) {
        errorDiv.textContent = "New password must be at least 8 characters";
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = "New passwords do not match";
        return;
    }
    
    const btn = document.getElementById("changePasswordBtn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "Updating...";
    
    const result = await confirmChangePasswordController2(currentPassword, newPassword);
    if (result.success) {
        window.location.href = "main.html";
    } else {
        errorDiv.textContent = result.error || "Error changing password";
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});