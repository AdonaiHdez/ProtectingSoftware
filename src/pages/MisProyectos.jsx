import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/devproyectos.css";

export default function MisProyectosDev() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [proyectos, setProyectos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Verificar si hay token y si el rol es DEVELOPER
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");

    if (!token) {
      // No hay token, redirigir al login
      navigate("/login");
      return;
    }

    if (role !== "DEVELOPER") {
      // No es DEVELOPER, redirigir al login
      navigate("/login");
      return;
    }

    // Cargar proyectos del desarrollador
    const fetchProjects = async () => {
      try {
        // Obtener el email del usuario desde localStorage
        const userEmail = localStorage.getItem("userEmail");
        
        // Si no tenemos email, no podemos continuar
        if (!userEmail) {
          throw new Error("No se encontró el email del usuario");
        }

        const response = await fetch(
          `http://localhost:8080/api/projects/developer/${encodeURIComponent(userEmail)}`,
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
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [navigate]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "No validado";
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="proyectos-container">
        <p>Cargando proyectos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="proyectos-container">
        <h2>My Projects</h2>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="proyectos-container">
      <h2>My Projects</h2>

      {proyectos.length === 0 ? (
        <p>No tienes proyectos asignados.</p>
      ) : (
        <div className="tabla-wrapper">
          <table className="proyectos-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Description</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Created At</th>
              </tr>
            </thead>

            <tbody>
              {proyectos.map((proyecto) => (
                <tr key={proyecto.id}>
                  <td>
                    <Link className="project-link" to={`/dev/project/${proyecto.id}`}>
                      {proyecto.name}
                    </Link>
                  </td>

                  <td>{proyecto.description}</td>

                  <td>
                    <span className={`status-badge status-${proyecto.status.toLowerCase()}`}>
                      {proyecto.status}
                    </span>
                  </td>

                  <td>{proyecto.ownerName}</td>

                  <td>{formatDate(proyecto.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
