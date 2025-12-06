import { useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/addprojects.css";
import "../styles/editproject.css";

export default function EditProject() {

  const { projectName } = useParams();

  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState("Proyecto de ejemplo.");

  const [assignedUsers, setAssignedUsers] = useState([
    { username: "@PandaKiller", view: true, download: true, upload: true },
    { username: "@angel_grx", view: true, download: false, upload: false },
  ]);
  const [confirmData, setConfirmData] = useState(null);  // Guarda el cambio que se quiere validar
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState("");
  const [newPerms, setNewPerms] = useState({
    view: true,
    download: false,
    upload: false
  });

  // ---- NUEVOS ESTADOS DEL HISTORIAL ----
  const [changeLog, setChangeLog] = useState([
    {
      user: "@PandaKiller",
      email: "panda@example.com",
      date: "2025-12-02",
      file: "update_v2.zip"
    },
    {
      user: "@angel_grx",
      email: "angel@example.com",
      date: "2025-12-01",
      file: "fix_01.patch"
    }
  ]);

  const [showToast, setShowToast] = useState(false);

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
  function removeUser(username) {
    setAssignedUsers(assignedUsers.filter(u => u.username !== username));
  }

  function addUser() {
    if (!newUser) return alert("Select a user.");
    setAssignedUsers([...assignedUsers, { username: newUser, ...newPerms }]);
    setShowModal(false);
    setNewUser("");
    setNewPerms({ view: true, download: false, upload: false });
  }

  function updatePermission(username, perm) {
    setAssignedUsers(
      assignedUsers.map(u =>
        u.username === username ? { ...u, [perm]: !u[perm] } : u
      )
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

        {/* Tabla de usuarios asignados */}
        <h3 className="sub-title">Assigned users</h3>

        <div className="tabla-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>View</th>
                <th>Download</th>
                <th>Upload</th>
                <th>Remove</th>
              </tr>
            </thead>

            <tbody>
              {assignedUsers.map((u) => (
                <tr key={u.username}>

                  <td>{u.username}</td>

                  <td style={{ textAlign: "center" }}>
                    <input 
                      type="checkbox"
                      checked={u.view}
                      onChange={() => updatePermission(u.username, "view")}
                    />
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <input 
                      type="checkbox"
                      checked={u.download}
                      onChange={() => updatePermission(u.username, "download")}
                    />
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <input 
                      type="checkbox"
                      checked={u.upload}
                      onChange={() => updatePermission(u.username, "upload")}
                    />
                  </td>

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
          Add user
        </button>

        {/* ---- NUEVA TABLA DE HISTORIAL DE CAMBIOS ---- */}
        <h3 className="sub-title">Historial de cambios</h3>

        <div className="tabla-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Fecha</th>
                <th>Archivo</th>
                <th>Validar</th>
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
                    className="validate-btn"
                    onClick={() => {
                      setConfirmData(c);
                      setShowConfirmModal(true);
                    }}
                  >
                    Validar
                  </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botón general */}
        <button className="btn-submit">Save changes</button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Add user</h3>

            <label>Select user</label>
            <select
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
            >
              <option value="">Select…</option>
              <option>@PandaKiller</option>
              <option>@hdez.ado</option>
              <option>@angel_grx</option>
            </select>

            <label>Permissions</label>
            <div className="perm-box">
              <label>
                <input
                  type="checkbox"
                  checked={newPerms.view}
                  onChange={() =>
                    setNewPerms({ ...newPerms, view: !newPerms.view })
                  }
                />
                View
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={newPerms.download}
                  onChange={() =>
                    setNewPerms({ ...newPerms, download: !newPerms.download })
                  }
                />
                Download
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={newPerms.upload}
                  onChange={() =>
                    setNewPerms({ ...newPerms, upload: !newPerms.upload })
                  }
                />
                Upload
              </label>
            </div>

            <button className="modal-btn" onClick={addUser}>
              Add
            </button>

            <button
              className="modal-close"
              onClick={() => setShowModal(false)}
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
