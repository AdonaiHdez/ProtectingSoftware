import { Routes,Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Proyectos from "./pages/Proyectos";
import AddProject from "./pages/AddProject";
import EditProject from "./pages/EditProject";
import MisProyectosDev from "./pages/MisProyectos";
import ProjectDetail from "./pages/ProyectDetail";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <Header />
      
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/proyectos" element={<Proyectos/>} />
          <Route path="/addproject" element={<AddProject/>} />
          <Route path="/editproject/:projectName" element={<EditProject />} />
          <Route path="/dev/projects" element={<MisProyectosDev/>} />
          <Route path="/dev/project/:projectName" element={<ProjectDetail />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
