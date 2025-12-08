import "../styles/login.css";
import loginBg from "../assets/login.png";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al iniciar sesión");
      }

      const data = await response.json();
      
      // Guardar token y datos de usuario
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      if (data.role) {
        localStorage.setItem("userRole", data.role);
      }
      if (data.name) {
        localStorage.setItem("userName", data.name);
      }
      // Guardar el email usado para login
      localStorage.setItem("userEmail", email);

      // Redirigir según el rol
      if (data.role === "DEVELOPER") {
        navigate("/dev/projects");
      } else if (data.role === "ADMIN") {
        navigate("/proyectos");
      } else {
        navigate("/proyectos"); // Ruta por defecto
      }
    } catch (err) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* IZQUIERDA */}
      <div className="login-left">
        <div className="login-card">
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Cargando..." : "Login"}
            </button>
          </form>

          <p>
            Forgot password?
            <Link to="/contactus" style={{ marginLeft: 4 }}>Contact us</Link>
          </p>
        </div>
      </div>

      {/* DERECHA */}
      <div className="login-right">
        <div className="login-card">
            <img src={loginBg} alt="Imagen de login" />
        </div>
      </div>

    </div>
  );
}
