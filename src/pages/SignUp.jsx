import { useState } from "react";
import "../styles/signup.css";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [privateKeyMsg, setPrivateKeyMsg] = useState("");
  const [showModal, setShowModal] = useState(false); //

  async function generarLlaves() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const privateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const publicKey = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );

    const privateKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(privateKey))
    );
    const publicKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(publicKey))
    );

    return { privateKeyBase64, publicKeyBase64 };
  }

  // 🟦 2. Handler del botón
async function handleSignUp() {
  if (password !== passwordConfirm) {
    alert("Las contraseñas no coinciden");
    return;
  }

  // Generar llaves
  const { privateKeyBase64, publicKeyBase64 } = await generarLlaves();

  // Crear JSON para el backend
  const body = {
    name: fullName,
    email: email,
    password: password,
    publicKey: publicKeyBase64,
  };

  try {
    await fetch("http://localhost:3000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.warn("Backend no disponible, pero seguimos…");
  }

  // 👉 MOSTRAR LA LLAVE PRIVADA SIEMPRE
  setPrivateKeyMsg(privateKeyBase64);

  // 👉 ABRIR EL MODAL
  setShowModal(true);
}


  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Add user</h2>

        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password confirmation"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />

        <button onClick={handleSignUp}>Add user</button>
      </div>

      {/* ✅ MODAL CORRECTAMENTE DENTRO DEL RETURN */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Usuario creado con éxito</h2>

            <p>Tu llave privada:</p>

            <textarea
              readOnly
              className="private-key-area"
              value={privateKeyMsg}
            />

            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(privateKeyMsg)}
            >
              Copiar llave privada
            </button>

            <button className="close-btn" onClick={() => setShowModal(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
