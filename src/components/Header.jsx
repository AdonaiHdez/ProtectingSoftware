import "../styles/header.css";
import { Link, useNavigate } from "react-router-dom";


export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Limpiar datos de sesión
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    
    // Redirigir al login
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-content">

        <h1 className="header-title">Protecting Software</h1>

        <nav className="header-nav">
          <Link to="/proyectos">Projects</Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>

      </div>
    </header>
  );
}
