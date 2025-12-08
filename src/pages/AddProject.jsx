import "../styles/addprojects.css";
import { useState, useEffect } from "react";

export default function AddProject() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados del formulario
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [projectLeader, setProjectLeader] = useState("");
  const [selectedDevs, setSelectedDevs] = useState([]);
  const [projectFile, setProjectFile] = useState(null);
  const [currentDevSelection, setCurrentDevSelection] = useState("");

  // Cargar lista de desarrolladores al montar el componente
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
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopers();
  }, []);

  // Manejar selección de múltiples desarrolladores
  const handleAddDev = (e) => {
    const selectedEmail = e.target.value;
    
    if (selectedEmail && !selectedDevs.includes(selectedEmail)) {
      setSelectedDevs([...selectedDevs, selectedEmail]);
    }
    
    // Resetear el select
    setCurrentDevSelection("");
  };

  // Eliminar desarrollador de la lista
  const handleRemoveDev = (emailToRemove) => {
    setSelectedDevs(selectedDevs.filter(email => email !== emailToRemove));
  };

  // Obtener nombre completo del desarrollador por email
  const getDevName = (email) => {
    const dev = developers.find(d => d.email === email);
    return dev ? dev.fullName : email;
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!projectName || !description || !projectLeader || selectedDevs.length === 0) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (!projectFile) {
      alert("Por favor selecciona un archivo ZIP inicial");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      
      // Crear FormData
      const formData = new FormData();

      // Generar JSON para el campo "data"
      const projectData = {
        name: projectName,
        description: description,
        ownerEmail: projectLeader,
        developerEmails: selectedDevs,
      };

      // Agregar datos como Blob JSON
      formData.append("data", new Blob([JSON.stringify(projectData)], { type: "application/json" }));
      
      // Agregar archivo ZIP
      formData.append("initialZip", projectFile);

      console.log("Enviando proyecto con archivo ZIP...");
      
      const response = await fetch("http://localhost:8080/api/projects", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          // NO incluir Content-Type, el navegador lo maneja automáticamente con FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el proyecto");
      }

      const data = await response.json();
      console.log("Proyecto creado exitosamente:", data);
      
      alert("Proyecto creado exitosamente");
      
      // Limpiar formulario
      setProjectName("");
      setDescription("");
      setProjectLeader("");
      setSelectedDevs([]);
      setProjectFile(null);
    } catch (err) {
      console.error("Error:", err);
      alert(err.message || "Error al crear el proyecto");
    }
  };

  return (
    <div className="addproject-page">


      <div className="addproject-card">

        <h2>Add new project</h2>

        <label>Project name</label>
        <input 
          type="text" 
          placeholder="Enter project name" 
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />

        <label>Description</label>
        <textarea 
          placeholder="Enter project description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>

        <label>Project Leader</label>
        <select 
          value={projectLeader}
          onChange={(e) => setProjectLeader(e.target.value)}
        >
          <option value="">Select project leader…</option>
          {loading ? (
            <option disabled>Loading developers...</option>
          ) : error ? (
            <option disabled>Error loading developers</option>
          ) : (
            developers.map((dev, index) => (
              <option key={index} value={dev.email}>
                {dev.fullName} ({dev.email})
              </option>
            ))
          )}
        </select>

        <label>Project Developers</label>
        <select 
          value={currentDevSelection}
          onChange={handleAddDev}
        >
          <option value="">Select developer to add…</option>
          {loading ? (
            <option disabled>Loading developers...</option>
          ) : error ? (
            <option disabled>Error loading developers</option>
          ) : (
            developers
              .filter(dev => dev.email !== projectLeader) // Excluir al líder
              .map((dev, index) => (
                <option 
                  key={index} 
                  value={dev.email}
                  disabled={selectedDevs.includes(dev.email)}
                >
                  {dev.fullName} ({dev.email})
                </option>
              ))
          )}
        </select>

        {/* Lista de desarrolladores seleccionados */}
        {selectedDevs.length > 0 && (
          <div className="selected-devs-list">
            {selectedDevs.map((email, index) => (
              <div key={index} className="dev-tag">
                <span>{getDevName(email)}</span>
                <button 
                  type="button"
                  className="remove-dev-btn"
                  onClick={() => handleRemoveDev(email)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <label>Upload initial project file (ZIP)</label>
        <input 
          type="file" 
          accept=".zip"
          onChange={(e) => setProjectFile(e.target.files[0])}
        />

        <button className="btn-submit" onClick={handleSubmit}>Save project</button>
      </div>

    </div>
  );
}
