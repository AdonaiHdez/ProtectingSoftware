import "../styles/proyectos.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Función para descargar proyecto sellado
  const handleDownloadSealed = async (projectId, projectName) => {
    const uploadId = prompt("Ingresa el uploadId que deseas descargar:");
    if (!uploadId) return;

    try {
      const token = localStorage.getItem("authToken");
      const userEmail = localStorage.getItem("userEmail");

      if (!userEmail) {
        throw new Error("No se encontró el email del usuario");
      }

      // 1. Obtener los datos del proyecto sellado
      const response = await fetch(
        `http://localhost:8080/api/projects/${projectId}/sealed/export?uploadId=${uploadId}&email=${encodeURIComponent(userEmail)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al obtener el proyecto sellado");
      }

      const sealedData = await response.json();
      
      // 2. Obtener la llave privada del usuario desde localStorage
      const privateKeyPem = localStorage.getItem("privateKey");
      if (!privateKeyPem) {
        throw new Error("No se encontró la llave privada. Por favor inicia sesión nuevamente.");
      }

      // 3. Importar la llave privada para descifrado RSA-OAEP
      const privateKey = await importPrivateKeyForUnwrapping(privateKeyPem);

      // 4. Descifrar la llave AES envuelta (wrappedKeyBase64)
      const wrappedKeyBytes = base64ToArrayBuffer(sealedData.wrappedKeyBase64);
      
      const unwrappedAesKey = await crypto.subtle.unwrapKey(
        "raw",                          // formato de la llave desenvuelta
        wrappedKeyBytes,                // llave envuelta (cifrada con RSA)
        privateKey,                     // llave privada RSA
        {
          name: "RSA-OAEP",
          hash: "SHA-256"
        },
        {
          name: "AES-GCM",
          length: 256
        },
        true,                           // extractable
        ["decrypt"]                     // usos
      );

      // 5. Descifrar el contenido del ZIP con AES-GCM
      const ciphertextBytes = base64ToArrayBuffer(sealedData.ciphertextBase64);
      const ivBytes = base64ToArrayBuffer(sealedData.ivBase64);

      const decryptedZipBytes = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivBytes,
          tagLength: 128
        },
        unwrappedAesKey,
        ciphertextBytes
      );

      // 6. Descargar el ZIP descifrado
      const blob = new Blob([decryptedZipBytes], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = sealedData.fileName.replace('.enc', '') || `${projectName}_upload_${uploadId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("Proyecto descargado y descifrado exitosamente");

    } catch (err) {
      console.error("Error:", err);
      alert("Error al descargar y descifrar: " + err.message);
    }
  };

  // Función para importar llave privada RSA para unwrapKey
  async function importPrivateKeyForUnwrapping(pem) {
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\s+/g, "");

    const binaryDer = atob(pemContents);
    const bytes = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      bytes[i] = binaryDer.charCodeAt(i);
    }

    return await crypto.subtle.importKey(
      "pkcs8",
      bytes.buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["unwrapKey", "decrypt"]
    );
  }

  // Función auxiliar para convertir Base64 a ArrayBuffer
  function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const userEmail = localStorage.getItem("userEmail");

        if (!userEmail) {
          throw new Error("No se encontró el email del usuario");
        }

        const response = await fetch(
          `http://localhost:8080/api/projects/ceo/list?email=${encodeURIComponent(userEmail)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener los proyectos");
        }

        const data = await response.json();
        setProyectos(data);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="proyectos-container">
        <p>Cargando proyectos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="proyectos-container">
        <h2>Error</h2>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="proyectos-container">
      <h2>Projects</h2>

      <div className="tabla-wrapper">
        <table className="proyectos-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Líder</th>
              <th>Desarrolladores</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {proyectos.length === 0 ? (
              <tr>
                <td colSpan="5">No hay proyectos disponibles</td>
              </tr>
            ) : (
              proyectos.map((proyecto) => (
                <tr key={proyecto.projectId}>
                  <td>
                    {proyecto.status === "SEALED" ? (
                      <span>{proyecto.name}</span>
                    ) : (
                      <Link className="project-link" to={`/editproject/${proyecto.projectId}`}>
                        {proyecto.name}
                      </Link>
                    )}
                  </td>
                  <td>{proyecto.ownerName || "Sin líder"}</td>
                  <td>
                    {proyecto.developers && proyecto.developers.length > 0
                      ? proyecto.developers.map(dev => dev.fullName).join(", ")
                      : "Sin desarrolladores"}
                  </td>
                  <td>
                    <span className={`status-badge status-${proyecto.status?.toLowerCase() || 'unknown'}`}>
                      {proyecto.status || "N/A"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {proyecto.status === "SEALED" && (
                      <button
                        className="btn-download"
                        onClick={() => handleDownloadSealed(proyecto.projectId, proyecto.name)}
                      >
                        Descargar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="tabla-buttons">
        <Link to="/addproject">
          <button className="btn-primary">Add project</button>
        </Link>

        <button className="btn-danger">Delete project</button>
      </div>
    </div>
  );
}
