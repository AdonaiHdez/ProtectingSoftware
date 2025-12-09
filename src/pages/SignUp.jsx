import { useState } from "react";
import "../styles/signup.css";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [privateKeyMsg, setPrivateKeyMsg] = useState("");
  const [publicKeyMsg, setPublicKeyMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

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

    if (!fullName || !email || !password) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      // Generar llaves
      const { privateKeyBase64, publicKeyBase64 } = await generarLlaves();

      // Crear JSON para el backend
      const body = {
        fullName: fullName,
        email: email,
        password: password,
        publicKey: publicKeyBase64,
      };

      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar usuario");
      }

      const data = await response.json();
      console.log("Usuario registrado exitosamente:", data);

      // 👉 MOSTRAR AMBAS LLAVES
      console.log("\n=== LLAVES GENERADAS ===");
      console.log("Llave PÚBLICA (enviada al backend):");
      console.log(publicKeyBase64);
      console.log("\nLlave PRIVADA (GUARDAR EN LUGAR SEGURO):");
      console.log(privateKeyBase64);
      console.log("\nPrimeros 50 chars de la pública:", publicKeyBase64.substring(0, 50));
      console.log("Primeros 50 chars de la privada:", privateKeyBase64.substring(0, 50));
      console.log("========================\n");

      setPrivateKeyMsg(privateKeyBase64);
      setPublicKeyMsg(publicKeyBase64);

      // 👉 ABRIR EL MODAL
      setShowModal(true);
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert(error.message || "Error al conectar con el servidor");
    }
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

      {/* MODAL CORRECTAMENTE DENTRO DEL RETURN */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Usuario creado con éxito</h2>

            <p style={{ marginTop: "20px", color: "#2193b0" }}>
              Llave PÚBLICA (enviada al backend):
            </p>
            <textarea
              readOnly
              className="private-key-area"
              value={publicKeyMsg}
              style={{ 
                minHeight: "100px"
              }}
            />
            <button
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(publicKeyMsg);
                alert("Llave pública copiada");
              }}
            >
              Copiar llave pública
            </button>

            <p style={{ color: "#1e3c72", marginTop: "12px" }}>
              Llave PRIVADA (GUÁRDALA EN LUGAR SEGURO):
            </p>
            <textarea
              readOnly
              className="private-key-area"
              value={privateKeyMsg}
              style={{ 
                minHeight: "140px"
              }}
            />

            <button
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(privateKeyMsg);
                alert("Llave privada copiada al portapapeles");
              }}
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
