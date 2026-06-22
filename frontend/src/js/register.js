import { register,loadLogin } from "./controller.js";

const form = document.getElementById("RegForm");

if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const password2 = document.getElementById("password2").value;

        console.log(nombre, email, password, password2);

        register(nombre, email, password, password2);
    });
}

const login = document.getElementById("go-login");
login.addEventListener("click", (e) => 
{
loadLogin();
})