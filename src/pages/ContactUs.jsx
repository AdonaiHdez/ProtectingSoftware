import "../styles/contactus.css";

export default function ContactUs() {
  return (
    <div className="contact-page">
      <div className="contact-card">

        <h2>Contact us</h2>

        <label>Your name</label>
        <input type="text" placeholder="Enter your name" />

        <label>Email</label>
        <input type="email" placeholder="Enter your email" />

        <label>Message</label>
        <textarea placeholder="Write your message here"></textarea>

        <button className="btn-submit">Send message</button>

      </div>
    </div>
  );
}
