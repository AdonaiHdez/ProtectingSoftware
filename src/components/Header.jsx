import "../styles/header.css";
import { Link } from "react-router-dom";


export default function Header() {
  return (
    <header className="header">
      <div className="header-content">

        <h1 className="header-title">Protecting Software</h1>

        <nav className="header-nav">
          <Link to="/proyectos">Projects</Link>
          <Link to="/contactus">Contact us</Link>
        </nav>

      </div>
    </header>
  );
}
