import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/proyectDetail.css";

export default function ProjectDetail() {
  const { projectName } = useParams(); // Este es el projectId

  const [projectDetail, setProjectDetail] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [zipFile, setZipFile] = useState(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);

  // Cargar detalles e historial del proyecto al montar el componente
  useEffect(() => {
    const fetchProjectDetail = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const response = await fetch(
          `http://localhost:8080/api/projects/${projectName}/detail`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener los detalles del proyecto");
        }

        const data = await response.json();
        
        setProjectDetail({
          projectId: data.projectId,
          name: data.name,
          description: data.description,
        });
        setHistorial(data.history || []);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetail();
  }, [projectName]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Manejar descarga de archivo
  const handleDownload = async (uploadId) => {
    try {
      const token = localStorage.getItem("authToken");
      const currentUserEmail = localStorage.getItem("userEmail");
      
      if (!currentUserEmail) {
        alert("No se encontró el email del usuario");
        return;
      }
      
      const response = await fetch(
        `http://localhost:8080/api/projects/${projectName}/download-challenge?uploadId=${uploadId}&developerEmail=${encodeURIComponent(currentUserEmail)}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al descargar el archivo");
      }

      // Obtener el nombre del archivo desde los headers si está disponible
      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = `upload_${uploadId}.zip`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear URL temporal para descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message || "Error al descargar el archivo");
    }
  };

  async function handleUpload() {
    if (!zipFile) return alert("Selecciona un archivo ZIP");

    try {
      const token = localStorage.getItem("authToken");
      const currentUserEmail = localStorage.getItem("userEmail");

      if (!currentUserEmail) {
        alert("No se encontró el email del usuario");
        return;
      }

      // 1. Extraer archivos del ZIP
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipFile);

      const allFiles = Object.keys(zipContent.files);

      // 2. Leer challenge.enc - buscar de forma más flexible
      let challengeEncFile = null;
      let challengeEncPath = null;
      
      // Buscar archivos que contengan "challenge.enc" (ignorando mayúsculas)
      for (const path of allFiles) {
        const file = zipContent.files[path];
        if (!file.dir) {
          const fileName = path.toLowerCase();
          if (fileName.includes("challenge.enc") || fileName.endsWith("challenge.enc")) {
            challengeEncFile = zipContent.file(path);
            challengeEncPath = path;
            break;
          }
        }
      }
      
      if (!challengeEncFile) {
        const fileList = allFiles.filter(f => !zipContent.files[f].dir).join("\n  - ");
        throw new Error(`No se encontró el archivo challenge.enc en el ZIP.\n\nArchivos disponibles:\n  - ${fileList}`);
      }
      
      // Leer challenge.enc como texto (viene en base64 desde el backend)
      const challengeEncBase64 = await challengeEncFile.async("text");
      
      // 2.5. Leer metadata.json para obtener el baseUploadId
      let baseUploadId = null;
      const metadataFile = zipContent.file("metadata.json");
      if (metadataFile) {
        try {
          const metadataText = await metadataFile.async("text");
          const metadata = JSON.parse(metadataText);
          
          if (metadata.challengeUploadId) {
            baseUploadId = metadata.challengeUploadId;
          }
        } catch (e) {
          console.warn("No se pudo leer metadata.json:", e);
        }
      }
      
      if (!baseUploadId) {
        throw new Error("No se encontró el baseUploadId en metadata.json");
      }
      
      // 3. Obtener la llave privada del usuario (siempre solicitarla al subir)
      let privateKeyPem = privateKeyInput.trim();
      if (!privateKeyPem) {
        // Mostrar modal para solicitar llave privada
        setShowModal(false);
        setShowPrivateKeyModal(true);
        return;
      }

      // 4. Descifrar el challenge con RSA-OAEP
      const challengeBase64 = await decryptChallenge(challengeEncBase64, privateKeyPem);

      // 5. Firmar el challenge (el string en Base64) con RSA-PSS
      const signature = await signChallenge(challengeBase64, privateKeyPem);

      // 6. Crear nuevo ZIP con challenge.txt y challenge.sig
      const newZip = new JSZip();
      
      // Copiar todos los archivos y carpetas existentes (excepto challenge.enc)
      const copyPromises = [];
      zipContent.forEach((relativePath, file) => {
        // Excluir challenge.enc (ignorando mayúsculas y ubicación)
        const pathLower = relativePath.toLowerCase();
        const isChallengeEnc = pathLower.includes("challenge.enc") || pathLower.endsWith("challenge.enc");
        
        if (!file.dir && !isChallengeEnc) {
          copyPromises.push(
            file.async("arraybuffer").then(content => {
              newZip.file(relativePath, content);
            })
          );
        } else if (file.dir) {
          newZip.folder(relativePath);
        }
      });

      // Esperar a que se copien todos los archivos
      await Promise.all(copyPromises);

      // Agregar challenge.txt (Base64 del challenge descifrado) y challenge.sig
      newZip.file("challenge.txt", challengeBase64);
      newZip.file("challenge.sig", signature);

      // 7. Generar el nuevo ZIP
      const newZipBlob = await newZip.generateAsync({ type: "blob" });

      // 8. Descargar el ZIP procesado
      const url = window.URL.createObjectURL(newZipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipFile.name;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 9. Enviar el ZIP procesado al backend usando el baseUploadId de metadata
      const formData = new FormData();
      formData.append("file", newZipBlob, zipFile.name);
      formData.append("uploadId", baseUploadId);
      formData.append("developerEmail", currentUserEmail);

      const uploadResponse = await fetch(
        `http://localhost:8080/api/projects/upload`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(errorText || "Error al subir el archivo procesado");
      }

      alert("ZIP procesado y enviado exitosamente al backend");
      
      setShowModal(false);
      setZipFile(null);
      setPrivateKeyInput("");
      
      // Recargar el historial para ver los cambios
      window.location.reload();
    } catch (err) {
      let errorMessage = "Error al procesar el archivo:\n\n";
      if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += String(err);
      }
      
      alert(errorMessage);
      setShowModal(false);
      setPrivateKeyInput("");
    }
  }

  // Función para descifrar el challenge con RSA-OAEP
  async function decryptChallenge(challengeEncData, privateKeyPem) {
    try {
      let encryptedData;
      
      if (challengeEncData instanceof ArrayBuffer) {
        encryptedData = new Uint8Array(challengeEncData);
      } else if (typeof challengeEncData === 'string') {
        encryptedData = Uint8Array.from(atob(challengeEncData.trim()), c => c.charCodeAt(0));
      } else {
        throw new Error("Formato de datos cifrados no reconocido");
      }

      const privateKey = await importPrivateKey(privateKeyPem);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        privateKey,
        encryptedData
      );

      // Convertir los bytes descifrados a Base64 (como lo generó el backend)
      const decryptedBytes = new Uint8Array(decryptedBuffer);
      const challengeBase64 = btoa(String.fromCharCode(...decryptedBytes));
      
      return challengeBase64;
    } catch (err) {
      throw new Error("Error al descifrar el challenge: " + err.message);
    }
  }

  // Función para firmar el challenge con RSA-PSS
  async function signChallenge(challengeText, privateKeyPem) {
    try {
      // Importar llave privada para firma
      const privateKey = await importPrivateKeyForSigning(privateKeyPem);

      // Convertir texto a buffer
      const encoder = new TextEncoder();
      const data = encoder.encode(challengeText);

      // Firmar con RSA-PSS
      const signature = await window.crypto.subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32, // 32 bytes de salt
        },
        privateKey,
        data
      );

      // Convertir a Base64
      const signatureArray = new Uint8Array(signature);
      return btoa(String.fromCharCode(...signatureArray));
    } catch (err) {
      throw new Error("Error al firmar el challenge: " + err.message);
    }
  }

  // Importar llave privada para descifrado (RSA-OAEP)
  async function importPrivateKey(pemKey) {
    try {
      const pemHeader = "-----BEGIN PRIVATE KEY-----";
      const pemFooter = "-----END PRIVATE KEY-----";
      
      // Limpiar la llave: remover headers si existen y espacios
      let keyContents = pemKey.trim();
      if (keyContents.includes(pemHeader)) {
        keyContents = keyContents.replace(pemHeader, "").replace(pemFooter, "");
      }
      keyContents = keyContents.replace(/\s/g, "");
      
      const binaryDer = Uint8Array.from(atob(keyContents), c => c.charCodeAt(0));

      return await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["decrypt"]
      );
    } catch (err) {
      throw new Error("Error al importar llave privada para descifrado: " + err.message);
    }
  }

  // Importar llave privada para firma (RSA-PSS)
  async function importPrivateKeyForSigning(pemKey) {
    try {
      const pemHeader = "-----BEGIN PRIVATE KEY-----";
      const pemFooter = "-----END PRIVATE KEY-----";
      
      // Limpiar la llave: remover headers si existen y espacios
      let keyContents = pemKey.trim();
      if (keyContents.includes(pemHeader)) {
        keyContents = keyContents.replace(pemHeader, "").replace(pemFooter, "");
      }
      keyContents = keyContents.replace(/\s/g, "");
      
      const binaryDer = Uint8Array.from(atob(keyContents), c => c.charCodeAt(0));

      return await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
          name: "RSA-PSS",
          hash: "SHA-256",
        },
        false,
        ["sign"]
      );
    } catch (err) {
      throw new Error("Error al importar llave privada para firma: " + err.message);
    }
  }

  // Guardar llave privada y continuar con upload
  const handleSavePrivateKey = async () => {
    if (!privateKeyInput.trim()) {
      alert("Por favor ingresa tu llave privada");
      return;
    }
    
    setShowPrivateKeyModal(false);
    
    // Reintentar el upload automáticamente con la llave ingresada
    if (zipFile) {
      await handleUpload();
    }
  };

  if (loading) {
    return (
      <div className="project-detail-container">
        <p>Cargando historial del proyecto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-detail-container">
        <h2>Error</h2>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!projectDetail) {
    return (
      <div className="project-detail-container">
        <p>No se encontraron detalles del proyecto.</p>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      <h2>{projectDetail.name}</h2>
      <p className="project-description">
        {projectDetail.description}
      </p>

      <div className="historial-wrapper">
        <h3>Version History</h3>

        {historial.length === 0 ? (
          <p>No hay versiones cargadas para este proyecto.</p>
        ) : (
          <table className="historial-table">
            <thead>
              <tr>
                <th>Developer</th>
                <th>Email</th>
                <th>File Name</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {historial.map((upload) => (
                <tr key={upload.uploadId}>
                  <td>{upload.developerName}</td>
                  <td>{upload.email}</td>
                  <td>{upload.fileName}</td>
                  <td>{formatDate(upload.uploadDate)}</td>
                  <td>
                    <button
                      className="btn-download"
                      disabled={!upload.uploadId}
                      onClick={() => handleDownload(upload.uploadId)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button className="btn-upload" onClick={() => setShowModal(true)}>
          Upload ZIP
        </button>
      </div>

      {/* ==== MODAL PARA CARGAR ZIP ==== */}
      {showModal && (
        <div className="modal-bg">
          <div className="modal">
            <h3>Upload new version</h3>

            <input
              type="file"
              accept=".zip"
              onChange={(e) => setZipFile(e.target.files[0])}
            />

            <div className="modal-buttons">
              <button className="btn-primary" onClick={handleUpload}>
                Send to backend
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setZipFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==== MODAL PARA INGRESAR LLAVE PRIVADA ==== */}
      {showPrivateKeyModal && (
        <div className="modal-bg">
          <div className="modal">
            <h3>Ingresa tu llave privada</h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
              Se requiere tu llave privada para descifrar y firmar el challenge
            </p>

            <textarea
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              style={{
                width: "100%",
                minHeight: "200px",
                padding: "10px",
                fontFamily: "monospace",
                fontSize: "12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginBottom: "15px"
              }}
            />

            <div className="modal-buttons">
              <button className="btn-primary" onClick={handleSavePrivateKey}>
                Guardar y continuar
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setShowPrivateKeyModal(false);
                  setPrivateKeyInput("");
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
