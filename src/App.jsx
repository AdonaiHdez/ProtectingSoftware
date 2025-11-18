import { Routes,Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Proyectos from "./pages/Proyectos";
import AddProject from "./pages/AddProject";
import ContactUs from "./pages/ContactUs";


function App() {
  return (
    <>
      <Header />
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/contactus" element={<ContactUs/>} />
        <Route path="/addproject" element={<AddProject />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
