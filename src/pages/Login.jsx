import "../styles/login.css";
import loginBg from "../assets/login.png";
import { div } from "framer-motion/client";
import { Link } from "react-router-dom";
export default function Login() {
  return (


    <div className="login-page">
      


      {/* IZQUIERDA */}
      <div className="login-left">
        <div className="login-card">

          <h2>Login</h2>

          <input type="email" placeholder="E-mail" />
          <input type="password" placeholder="Password" />

          <Link to="/proyectos">
          <button className="btn-primary">Login</button>
          </Link>

          <p>
            Forgot password?
            <a href="#" style={{ marginLeft: 4 }}>Contact us</a>
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
