import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} Protecting Software — Todos los derechos reservados</p>
      </div>
    </footer>
  );
}
