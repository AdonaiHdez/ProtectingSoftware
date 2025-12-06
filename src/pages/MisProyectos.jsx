import { Link } from "react-router-dom";
import "../styles/devproyectos.css";
export default function MisProyectosDev() {

  // Ejemplo de datos. En tu backend vendrán con la info del validador
  const proyectos = [
    {
      nombre: "Practica03",
      permisos: "View, Download, Edit",
      validador: "senior_dev",
      fecha: "2025-12-05 14:22"
    },
    {
      nombre: "ModuloPagos",
      permisos: "View",
      validador: "—",
      fecha: "No validado"
    },
    {
      nombre: "TT01",
      permisos: "View, Download",
      validador: "crypto_master",
      fecha: "2025-12-03 18:10"
    }
  ];

  return (
    <div className="proyectos-container">
      <h2>My Projects</h2>

      <div className="tabla-wrapper">
        <table className="proyectos-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Permissions</th>
              <th>Validated by / Date & Time</th>
            </tr>
          </thead>

          <tbody>
            {proyectos.map((p, index) => (
              <tr key={index}>
                <td>
                    <Link className="project-link" to={`/dev/project/${p.nombre}`}>
                    {p.nombre}
                  </Link>
                </td>

                <td>{p.permisos}</td>

                <td>
                  {p.validador !== "—" ? (
                    <>
                      <span>{p.validador}</span>
                      <br />
                      <span>{p.fecha}</span>
                    </>
                  ) : (
                    <span>No validation</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
