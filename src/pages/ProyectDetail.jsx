import { useParams } from "react-router-dom";
import { useState } from "react";
import "../styles/proyectDetail.css";

export default function ProjectDetail() {
  const { projectName } = useParams();

  // MOCK inicial del historial
  const [historial, setHistorial] = useState([
    {
      usuario: "angel_grx",
      correo: "angel@correo.com",
      archivo: "version1.zip",
      fecha: "2025-12-05 14:30",
      validadoPor: "senior_dev",
      validadoFecha: "2025-12-05 14:45",
      urlDescarga: "/fake/version1.zip"
    },
    {
      usuario: "pandakiller",
      correo: "panda@correo.com",
      archivo: "fix_bug.zip",
      fecha: "2025-12-03 18:10",
      validadoPor: "crypto_master",
      validadoFecha: "2025-12-03 18:40",
      urlDescarga: "/fake/fix_bug.zip"
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [zipFile, setZipFile] = useState(null);

  function handleUpload() {
    if (!zipFile) return alert("Selecciona un archivo ZIP");

    // Aquí preparamos el body que va al backend
    const formData = new FormData();
    formData.append("project", projectName);
    formData.append("zip", zipFile);

    // FUTURO: enviar al backend
    /*
    fetch("http://tu-back/api/uploadVersion", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
        // agregar a tabla
    });
    */

    // Simulación mientras no hay backend:
    const newVersion = {
      usuario: "dev_actual",
      correo: "dev@mail.com",
      archivo: zipFile.name,
      fecha: new Date().toLocaleString(),
      validadoPor: "—",
      validadoFecha: "No validado",
      urlDescarga: "#"
    };

    setHistorial([newVersion, ...historial]);
    setShowModal(false);
    setZipFile(null);
  }

  return (
    <div className="project-detail-container">
      <h2>Project: {projectName}</h2>
      <p className="project-description">
        Example description for project {projectName}. (Esto vendrá del backend)
      </p>

      <div className="historial-wrapper">
        <h3>Version History</h3>

        <table className="historial-table">
          <thead>
            <tr>
              <th>Developer</th>
              <th>Email</th>
              <th>File</th>
              <th>Date</th>
              <th>Download</th>
              <th>Validated by / Date</th>
            </tr>
          </thead>

          <tbody>
            {historial.map((v, i) => (
              <tr key={i}>
                <td>@{v.usuario}</td>
                <td>{v.correo}</td>
                <td>{v.archivo}</td>
                <td>{v.fecha}</td>

                <td>
                  <a
                    href={v.urlDescarga}
                    className="btn-download"
                    download
                  >
                    Download
                  </a>
                </td>

                <td>
                  {v.validadoPor !== "—" ? (
                    <>
                      <span>{v.validadoPor}</span>
                      <br />
                      <span>{v.validadoFecha}</span>
                    </>
                  ) : (
                    <span className="no-validado">No validation</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
    </div>
  );
}
