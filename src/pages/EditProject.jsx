import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/addprojects.css";
import "../styles/editproject.css";

export default function EditProject() {

  const { projectName } = useParams(); // Este es el projectId

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [developers, setDevelopers] = useState([]);
  const [projectLeaderEmail, setProjectLeaderEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  
  const [confirmData, setConfirmData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState("");
  const [tempSelectedDevs, setTempSelectedDevs] = useState([]);

  const [changeLog, setChangeLog] = useState([]);
  const [showToast, setShowToast] = useState(false);

  // Cargar lista de desarrolladores disponibles
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        
        const response = await fetch("http://localhost:8080/api/users/developers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener la lista de desarrolladores");
        }

        const data = await response.json();
        setDevelopers(data);
      } catch (err) {
        console.error("Error al cargar desarrolladores:", err);
      }
    };

    fetchDevelopers();
  }, []);

  // Cargar datos del proyecto y su historial
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const userEmail = localStorage.getItem("userEmail");
        const adminEmailStored = localStorage.getItem("userEmail"); // Email del usuario logueado (admin)
        setAdminEmail(adminEmailStored || "");

        if (!userEmail) {
          throw new Error("No se encontró el email del usuario");
        }

        // 1. Obtener lista de proyectos con developers
        const listResponse = await fetch(
          `http://localhost:8080/api/projects/ceo/list?email=${encodeURIComponent(userEmail)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (!listResponse.ok) {
          throw new Error("Error al obtener la lista de proyectos");
        }

        const projects = await listResponse.json();
        const projectData = Array.isArray(projects) 
          ? projects.find(p => p.projectId?.toString() === projectName)
          : null;

        if (!projectData) {
          throw new Error("Proyecto no encontrado");
        }

        // 2. Obtener historial del proyecto
        const detailResponse = await fetch(
          `http://localhost:8080/api/projects/${projectName}/detail`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (!detailResponse.ok) {
          throw new Error("Error al obtener el historial del proyecto");
        }

        const detailData = await detailResponse.json();

        // Setear datos del proyecto
        setName(projectData.name);
        setDescription(projectData.description);
        setProjectLeaderEmail(projectData.ownerEmail || "");
        
        // Convertir developers a formato de assignedUsers
        const users = projectData.developers && Array.isArray(projectData.developers) 
          ? projectData.developers.map(dev => ({
              username: dev.fullName,
              email: dev.email
            }))
          : [];
        
        setAssignedUsers(users);

        // Cargar historial de cambios
        if (detailData.history && Array.isArray(detailData.history)) {
          const history = detailData.history.map(h => ({
            user: h.developerName,
            email: h.email,
            date: h.uploadDate,
            file: h.fileName,
            uploadId: h.uploadId
          }));
          setChangeLog(history);
        }
        
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectName]);

  // ---- FUNCIÓN PARA DESCARGAR UPLOAD DEL HISTORIAL ----
  async function handleDownloadUpload(uploadId, fileName) {
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `http://localhost:8080/api/projects/${projectName}/download-upload?uploadId=${uploadId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al descargar el archivo");
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `upload_${uploadId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error("Error:", err);
      alert("Error al descargar el archivo: " + err.message);
    }
  }

  // ---- FUNCIÓN PARA GUARDAR CAMBIOS DEL PROYECTO ----
  async function handleSaveProject() {
    try {
      const token = localStorage.getItem("authToken");

      const payload = {
        name: name,
        description: description
      };

      const response = await fetch(
        `http://localhost:8080/api/projects/${projectName}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al actualizar el proyecto");
      }

      alert("Proyecto actualizado exitosamente");
      
    } catch (err) {
      console.error("Error:", err);
      alert("Error al actualizar el proyecto: " + err.message);
    }
  }

  // ---- FUNCIÓN PARA RESGUARDAR (SEAL) UN UPLOAD ----
  async function handleSealUpload(uploadId) {
    const confirmSeal = window.confirm("¿Estás seguro de resguardar este cambio?");
    if (!confirmSeal) return;

    try {
      const token = localStorage.getItem("authToken");
      const sealedByEmail = localStorage.getItem("userEmail");

      // Lista de correos que podrán descifrar: CEO (admin) y líder del proyecto
      const ceoEmail = "admin@protecting-software.com";
      const allowedEmails = [ceoEmail, projectLeaderEmail].filter(email => email);

      if (allowedEmails.length === 0) {
        throw new Error("No se pudieron determinar los correos autorizados");
      }

      console.log("Emails autorizados para descifrar:", allowedEmails);

      const response = await fetch(
        `http://localhost:8080/api/projects/${projectName}/seal?uploadId=${uploadId}&sealedByEmail=${encodeURIComponent(sealedByEmail)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(allowedEmails)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al resguardar el cambio");
      }

      alert("Cambio resguardado exitosamente");
      
    } catch (err) {
      console.error("Error:", err);
      alert("Error al resguardar: " + err.message);
    }
  }

  // ---- FUNCIÓN PARA VALIDAR CAMBIO ----
  async function validarCambio(cambio) {
    const payload = {
      project: name,
      user: cambio.user,
      email: cambio.email,
      date: cambio.date,
      file: cambio.file
    };

    try {
      await fetch("https://tu-backend.com/validacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);

    } catch (err) {
      console.error("Error:", err);
      alert("Hubo un error al validar el cambio.");
    }
  }

  // ---- FUNCIONES EXISTENTES ----
  async function removeUser(username) {
    const userToRemove = assignedUsers.find(u => u.username === username);
    if (!userToRemove) return;

    const confirmRemove = window.confirm(`¿Estás seguro de eliminar a ${username} del proyecto?`);
    if (!confirmRemove) return;

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `http://localhost:8080/api/projects/${projectName}/developers?developerEmail=${encodeURIComponent(userToRemove.email)}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al eliminar desarrollador");
      }

      // Actualizar la lista local
      setAssignedUsers(assignedUsers.filter(u => u.username !== username));
      alert("Desarrollador eliminado exitosamente");
    } catch (err) {
      console.error("Error:", err);
      alert("Error al eliminar desarrollador: " + err.message);
    }
  }

  // Agregar desarrollador a la lista temporal del modal
  function handleAddDevToModal() {
    if (newUser) {
      const dev = developers.find(d => d.email === newUser);
      if (dev && !tempSelectedDevs.includes(newUser) && !assignedUsers.some(u => u.email === newUser)) {
        setTempSelectedDevs([...tempSelectedDevs, newUser]);
      }
      setNewUser("");
    }
  }

  // Quitar desarrollador de la lista temporal
  function handleRemoveDevFromModal(emailToRemove) {
    setTempSelectedDevs(tempSelectedDevs.filter(email => email !== emailToRemove));
  }

  // Obtener nombre del desarrollador por email
  function getDevName(email) {
    const dev = developers.find(d => d.email === email);
    return dev ? dev.fullName : email;
  }

  // Confirmar y agregar todos los desarrolladores seleccionados
  async function addUser() {
    if (tempSelectedDevs.length === 0) {
      alert("Selecciona al menos un desarrollador");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `http://localhost:8080/api/projects/${projectName}/developers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(tempSelectedDevs)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al agregar desarrolladores");
      }

      // Actualizar la lista local
      const newUsers = tempSelectedDevs.map(email => {
        const dev = developers.find(d => d.email === email);
        return { username: dev.fullName, email: dev.email };
      });
      setAssignedUsers([...assignedUsers, ...newUsers]);
      setTempSelectedDevs([]);
      setNewUser("");
      setShowModal(false);
      
      alert("Desarrolladores agregados exitosamente");
    } catch (err) {
      console.error("Error:", err);
      alert("Error al agregar desarrolladores: " + err.message);
    }
  }

  // Cancelar y limpiar selección temporal
  function cancelAddUser() {
    setTempSelectedDevs([]);
    setNewUser("");
    setShowModal(false);
  }



  if (loading) {
    return (
      <div className="addproject-page">
        <div className="addproject-card">
          <p>Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="addproject-page">
        <div className="addproject-card">
          <h2>Error</h2>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="addproject-page">

      <div className="addproject-card">

        <h2>Edit project: {name}</h2>

        {/* Nombre del proyecto */}
        <label>Project name</label>
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Descripción */}
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>

        {/* Botón de guardar cambios */}
        <button className="btn-submit" onClick={handleSaveProject}>Save changes</button>

        {/* Tabla de usuarios asignados */}
        <h3 className="sub-title">Assigned developers</h3>

        <div className="tabla-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Remove</th>
              </tr>
            </thead>

            <tbody>
              {assignedUsers.map((u) => (
                <tr key={u.username}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="remove-btn"
                      onClick={() => removeUser(u.username)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botón para agregar usuario */}
        <button
          className="add-user-btn"
          onClick={() => setShowModal(true)}
        >
          Add developer
        </button>

        {/* ---- NUEVA TABLA DE HISTORIAL DE CAMBIOS ---- */}
        <h3 className="sub-title">Change history</h3>

        <div className="tabla-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Developer</th>
                <th>Email</th>
                <th>Fecha</th>
                <th>Archivo</th>
                <th>Descargar</th>
                <th>Resguardar</th>
              </tr>
            </thead>

            <tbody>
              {changeLog.map((c, idx) => (
                <tr key={idx}>
                  <td>{c.user}</td>
                  <td>{c.email}</td>
                  <td>{c.date}</td>
                  <td>{c.file}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="btn-download"
                      onClick={() => handleDownloadUpload(c.uploadId, c.file)}
                    >
                      Download
                    </button>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="validate-btn"
                      onClick={() => handleSealUpload(c.uploadId)}
                    >
                      Resguardar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Add developer</h3>

            <label>Select user</label>
            <select
              value=""
              onChange={(e) => {
                const selectedEmail = e.target.value;
                if (selectedEmail) {
                  const dev = developers.find(d => d.email === selectedEmail);
                  if (dev && !tempSelectedDevs.includes(selectedEmail) && !assignedUsers.some(u => u.email === selectedEmail)) {
                    setTempSelectedDevs([...tempSelectedDevs, selectedEmail]);
                  }
                }
              }}
            >
              <option value="">Select developer to add…</option>
              {developers
                .filter(dev => 
                  !assignedUsers.some(u => u.email === dev.email) &&
                  !tempSelectedDevs.includes(dev.email)
                )
                .map(dev => (
                  <option key={dev.email} value={dev.email}>
                    {dev.fullName} ({dev.email})
                  </option>
                ))}
            </select>

            {/* Lista de desarrolladores seleccionados temporalmente */}
            {tempSelectedDevs.length > 0 && (
              <div className="selected-devs-list" style={{ marginTop: "15px" }}>
                {tempSelectedDevs.map((email) => (
                  <div key={email} className="dev-tag">
                    <span>{getDevName(email)}</span>
                    <button 
                      type="button"
                      className="remove-dev-btn"
                      onClick={() => handleRemoveDevFromModal(email)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button className="modal-btn" onClick={addUser}>
              Add selected ({tempSelectedDevs.length})
            </button>

            <button
              className="modal-close"
              onClick={cancelAddUser}
            >
              Cancel
            </button>

          </div>
        </div>
      )}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Confirmar validación</h3>

            <p>¿Estás seguro que deseas validar y resguardar este cambio?</p>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                className="modal-btn"
                onClick={() => {
                  validarCambio(confirmData);
                  setShowConfirmModal(false);
                  setConfirmData(null);
                }}
              >
                Sí, validar
              </button>

              <button
                className="modal-close"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmData(null);
                }}
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ---- TOAST ---- */}
      {showToast && (
        <div className="toast">
          Enviado a validación
        </div>
      )}

    </div>
  );
}
