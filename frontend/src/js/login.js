import { login,loadregister } from "./controller.js"

const token = localStorage.getItem("access_token");

if (token)
{
    window.location.href = "/main.html";
}

let rolSeleccionado = "";

const boton_login = document.querySelector(".login-btn");
boton_login.addEventListener("click",(e) => 
{
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    login(email,password,rolSeleccionado)
})

const botones = document.querySelectorAll(".button button");

botones.forEach(boton => 
{
    boton.addEventListener("click", () => {

        botones.forEach(b => b.classList.remove("active"));
        boton.classList.add("active");

        rolSeleccionado = boton.id; // btn-students, btn-teachers...
    });
})

/*const registrar = document.getElementById("go-register");
registrar.addEventListener("click", (e) => 
{
loadregister();
})*/

const forgotLink = document.getElementById("forgotPasswordLink");
if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "forgot-password.html";
    });
}