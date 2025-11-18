import "../styles/addprojects.css";

export default function AddProject() {
  return (
    <div className="addproject-page">


      <div className="addproject-card">

        <h2>Add new project</h2>

        <label>Project name</label>
        <input type="text" placeholder="Enter project name" />

        <label>Description</label>
        <textarea placeholder="Enter project description"></textarea>

        <label>Assign user</label>
        <select>
          <option value="">Select user…</option>
          <option>@PandaKiller</option>
          <option>@hdez.ado</option>
          <option>@angel_grx</option>
        </select>

        <label>Upload project file</label>
        <input type="file" />

        <button className="btn-submit">Save project</button>
      </div>

    </div>
  );
}
