import "../styles/proyectos.css";
import { Link } from "react-router-dom";



export default function Proyectos() {
  return (
    <div className="proyectos-container">
      <h2>Projects</h2>

      <div className="tabla-wrapper">
        <table className="proyectos-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>User</th>
              <th>Permissions</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Practica03</td>
              <td>@PandaKiller</td>
              <td>View, Download and Edit</td>
            </tr>
            <tr>
              <td>FirstSteps</td>
              <td>@hdez.ado</td>
              <td>View</td>
            </tr>
            <tr>
              <td>TT01</td>
              <td>@angel_grx</td>
              <td>view, Download</td>
            </tr>
          </tbody>
        </table>
        
      </div>
              <div className="tabla-buttons">
          <Link to="/addproject">
            <button className="btn-primary">Add project</button>
          </Link>
          <button className="btn-primary">Add user</button>
          <button className="btn-secondary">Assign permissions</button>
          <button className="btn-danger">Delete project</button>
        </div>
    </div>
  );
}
