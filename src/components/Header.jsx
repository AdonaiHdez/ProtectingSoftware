import "../styles/header.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";


export default function Header() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    // Limpiar datos de sesión
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    
    setIsLoggedIn(false);
    
    // Redirigir al login
    navigate("/login");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-content">

        <h1 className="header-title">Protecting Software</h1>

        <nav className="header-nav">
          {isLoggedIn ? (
            <button onClick={handleLogout} className="logout-btn">
              Cerrar sesión
            </button>
          ) : (
            <button onClick={handleLogin} className="logout-btn">
              Iniciar sesión
            </button>
          )}
        </nav>

      </div>
    </header>
  );
}
