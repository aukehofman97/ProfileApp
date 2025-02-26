import React, { useState, useEffect } from 'react';
import * as rdf from 'rdflib';
import './App.css';
import { useAuth0 } from "@auth0/auth0-react";

const DIGITALTWIN_TTL = process.env.PUBLIC_URL + "/data/DigitalTwin.ttl";
const EVENT_TTL = process.env.PUBLIC_URL + "/data/Event.ttl";

const ClickableItem = ({ name, addToProfile }) => (
  <button className="clickable-button spaced-button" onClick={() => addToProfile(name)}>
    {name}
  </button>
);

const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return <button className="auth-button" disabled>Loading...</button>;

  return !isAuthenticated ? (
    <button className="auth-button" onClick={() => loginWithRedirect()}>Log In</button>
  ) : null;
};

const LogoutButton = () => {
  const { logout, isAuthenticated } = useAuth0();

  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
    window.location.reload(); // Refresh auth state after logout
  };

  return isAuthenticated ? (
    <button className="auth-button" onClick={handleLogout}>Log Out</button>
  ) : null;
};

const Profile = () => {
  const { user, isAuthenticated } = useAuth0();

  return isAuthenticated ? (
    <div className="profile-container">
      <img src={user.picture} alt={user.name} className="profile-picture" />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  ) : null;
};

const ProfileArea = ({ fields, removeItem }) => (
  <div className="profile-box">
    <h3 className="profile-title">Profile</h3>
    {fields.length === 0 ? (
      <p className="drop-placeholder">Click fields to add them...</p>
    ) : (
      <div className="profile-field-container">
        {fields.map((field, index) => (
          <div key={index} className="profile-field">
            {field.label}
            <button className="delete-btn" onClick={() => removeItem(field)}>✖</button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const App = () => {
  const { isAuthenticated, isLoading } = useAuth0();
  const [fields, setFields] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [profileName, setProfileName] = useState("");
  const [downloadLink, setDownloadLink] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [jsonPreview, setJsonPreview] = useState(null);
  const [page, setPage] = useState("home");

  useEffect(() => {
    const loadTTLFiles = async () => {
      try {
        const digitalTwinData = await fetch(DIGITALTWIN_TTL).then(res => res.text());
        const eventData = await fetch(EVENT_TTL).then(res => res.text());

        const classes = extractOwlClasses(digitalTwinData + eventData);
        setAvailableFields(classes);
      } catch (error) {
        console.error("❌ Error loading TTL files:", error);
      }
    };

    loadTTLFiles();
  }, []);

  const extractOwlClasses = (ttlData) => {
    const store = rdf.graph();
    rdf.parse(ttlData, store, "http://example.com#", "text/turtle");

    const owl = rdf.Namespace("http://www.w3.org/2002/07/owl#");
    let classes = [];

    store.statementsMatching(null, rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), owl("Class"))
      .forEach(stmt => {
        const classURI = stmt.subject.value;
        const label = classURI.split("#").pop() || classURI.split("/").pop();
        classes.push({ uri: classURI, label });
      });

    return classes;
  };

  const addToProfile = (field) => {
    if (!fields.find(f => f.uri === field.uri)) {
      setFields([...fields, field]);
    }
  };

  const removeItem = (field) => {
    setFields(fields.filter(f => f.uri !== field.uri));
  };

  const saveProfile = () => {
    if (profileName.trim() === "") {
      alert("Please enter a profile name before saving.");
      return;
    }

    const blob = new Blob(["Placeholder TTL content"], { type: "text/turtle" });
    const url = URL.createObjectURL(blob);

    setDownloadLink(url);
    setDownloadFilename(`${profileName.replace(/\s+/g, "_")}.ttl`);

    const jsonData = {};
    fields.forEach(field => {
      jsonData[field.label] = { type: "Class", properties: {} };
    });

    setJsonPreview(jsonData);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Interoperability Agent</h1>
        <nav className="nav-links">
          <span onClick={() => setPage("home")}>Home</span>
          <span onClick={() => setPage("about")}>About</span>
          <span onClick={() => setPage("service")}>Our Service</span>
          <span onClick={() => setPage("demo")}>Demo</span>
          {isAuthenticated ? <LogoutButton /> : <LoginButton />}
        </nav>
      </header>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {page === "about" && <section className="content-section"><h2>About Us</h2><p>We are an interoperability-focused platform...</p></section>}
          {page === "service" && <section className="content-section"><h2>Our Service</h2><p>We provide data-sharing solutions for logistics...</p></section>}
          {page === "demo" && isAuthenticated ? (
            <section className="profile-builder-section">
              <Profile />
              <input type="text" className="profile-name-input" placeholder="Enter profile name..." value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              <div className="clickable-container">
                <div className="available-fields"><h3>Available Fields</h3><div className="field-buttons">{availableFields.map((concept, index) => (<ClickableItem key={index} name={concept.label} addToProfile={() => addToProfile(concept)} />))}</div></div>
                <ProfileArea fields={fields} removeItem={removeItem} />
              </div>
            </section>
          ) : page === "demo" ? <p className="restricted-message">Please log in to access the demo.</p> : null}
        </>
      )}
    </div>
  );
};

export default App;