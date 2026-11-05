
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { auth } from "./firebase.js";

const ADMIN_SESSION_KEY = "formatiAdminSession";

const ADMIN_EMAILS = [
  "guilhermeferreira07.dev@gmail.com",
  "andressa.home@outlook.com"
];

function isAuthorized(user) {
  return !!user && ADMIN_EMAILS.includes(
    (user.email || "").toLowerCase()
  );
}

// Cache apenas para exibir o nome no painel.
// A autorização real depende do Firebase e das regras do Firestore.
function getAdminSession() {
  try {
    return JSON.parse(
      localStorage.getItem(ADMIN_SESSION_KEY) || "null"
    );
  } catch {
    return null;
  }
}

function isAdminAuthenticated() {
  return isAuthorized(auth.currentUser);
}

function requireAdmin() {
  onAuthStateChanged(auth, user => {
    if (!isAuthorized(user)) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      location.replace("admin-login.html");
      return;
    }

    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
      authenticated: true,
      username: user.email,
      name: user.displayName || user.email,
      role: "Administrador"
    }));
  });
}

async function adminLogout() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  await signOut(auth);
  location.replace("admin-login.html");
}

function openRecovery() {
  document.getElementById("recoveryModal")?.classList.add("open");
}

function closeRecovery() {
  document.getElementById("recoveryModal")?.classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
  const login = document.getElementById("adminLoginForm");
  const recovery = document.getElementById("recoveryForm");
  const msg = document.getElementById("loginMessage");

  if (document.body.classList.contains("admin-shell")) {
    requireAdmin();
  }

  if (login) {
    onAuthStateChanged(auth, user => {
      if (isAuthorized(user)) {
        location.replace("admin.html");
      }
    });

    login.addEventListener("submit", async event => {
      event.preventDefault();

      const email = document
        .getElementById("adminUser")
        .value.trim().toLowerCase();

      const password = document.getElementById("adminPassword").value;
      const button = login.querySelector('button[type="submit"]');

      console.log("[FormaTI] Diagnóstico:", {
        email,
        tamanhoSenha: password.length,
        projeto: auth.app.options.projectId
      });
      
      msg.hidden = true;
      button.disabled = true;
      button.textContent = "Entrando...";

      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        if (!isAuthorized(credential.user)) {
          await signOut(auth);
          throw new Error("unauthorized");
        }

        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
          authenticated: true,
          username: credential.user.email,
          name: credential.user.displayName || credential.user.email,
          role: "Administrador"
        }));

        location.replace("admin.html");
      } catch (error) {
        console.error("[FormaTI] Falha no login:", error.code || error.message);

        msg.hidden = false;
        msg.className = "auth-message error";
        msg.textContent =
          "Não foi possível entrar. Confira o e-mail e a senha ou verifique se sua conta está autorizada.";
      } finally {
        button.disabled = false;
        button.textContent = "Entrar no painel";
      }
    });
  }

  if (recovery) {
    recovery.addEventListener("submit", async event => {
      event.preventDefault();

      const email = document
        .getElementById("recoveryEmail")
        .value.trim().toLowerCase();

      if (!ADMIN_EMAILS.includes(email)) {
        alert("Não foi possível processar a solicitação para esse endereço.");
        return;
      }

      try {
        await sendPasswordResetEmail(auth, email);
        closeRecovery();
        alert("Se a conta estiver cadastrada, você receberá as instruções de recuperação por e-mail.");
      } catch (error) {
        console.error("[FormaTI] Falha na recuperação:", error.code);
        alert("Não foi possível enviar o e-mail de recuperação. Verifique a configuração do Firebase.");
      }
    });
  }
});

Object.assign(window, {
  getAdminSession,
  isAdminAuthenticated,
  requireAdmin,
  adminLogout,
  openRecovery,
  closeRecovery
});
