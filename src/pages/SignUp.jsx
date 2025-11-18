import "../styles/signup.css";

export default function SignUp() {
  return (
    <div className="signup-page">
      <div className="signup-card">

        <h2>Add user</h2>

        <input type="text" placeholder="Full name" />
        <input type="email" placeholder="E-mail" />
        <input type="password" placeholder="Password" />
        <input type="password" placeholder="Password confirmation" />

        <button>Add user</button>


      </div>
    </div>
  );
}
