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
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  useEffect(() => {
    console.log("Login button auth state:", isAuthenticated);
  }, [isAuthenticated]);

  return <button className="auth-button" onClick={() => loginWithRedirect()}>Log In</button>;
};

const LogoutButton = () => {
  const { logout, isAuthenticated } = useAuth0();

  useEffect(() => {
    console.log("Logout button auth state:", isAuthenticated);
  }, [isAuthenticated]);

  return <button className="auth-button" onClick={() => 
    logout({ 
      logoutParams: {
        returnTo: "https://interoperabilityagent.eu"
      }
    })
  }>Log Out</button>;
};

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    console.log("Profile component state:", { isAuthenticated, isLoading, user });
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    isAuthenticated && user && (
      <div className="profile-container">
        <img src={user.picture} alt={user.name} className="profile-picture" />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
    )
  );
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
  const { isAuthenticated, isLoading, error } = useAuth0();
  const [fields, setFields] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [profileName, setProfileName] = useState("");
  const [downloadLink, setDownloadLink] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [jsonPreview, setJsonPreview] = useState(null);
  const [page, setPage] = useState("home");

  useEffect(() => {
    console.log("App auth state:", { isAuthenticated, isLoading, error });
  }, [isAuthenticated, isLoading, error]);

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

  if (error) {
    return <div>Authentication Error: {error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading application...</div>;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title" onClick={() => setPage("home")} style={{ cursor: 'pointer' }}>Interoperability Agent</h1>
        <nav className="nav-links">
          <span onClick={() => setPage("about")}>About</span>
          <span onClick={() => setPage("service")}>Our Service</span>
          <span onClick={() => setPage("demo")}>Demo</span>
          {isAuthenticated ? <LogoutButton /> : <LoginButton />}
        </nav>
      </header>

      {page === "about" && (
        <section className="content-section">
          <div className="about-main">
            <h2>About</h2>
            <p>Interoperability Agent enables organizations to share data by providing them with the necessary capabilities. We provide services, downloadable software supporting (inter)national standards, and online tooling to configurate this software. Our core focus is to enable data transformation with Large Language Models (LLMs) and common semantics. We provide services to</p>
          </div>
          
          <div className="about-subsections-container">
            <div className="about-subsection">
              <h2>Mission</h2>
              <p>Our mission is to make data sharing a commodity, like the Internet and the mobile network. We provide solutions and services whereby each organization can share data with any other one, for all types of use cases.</p>
            </div>

            <div className="about-subsection">
              <h2>Market</h2>
              <p>Supply and logistics are our primary market. It is about movement, storage, handling, and value-added services for products, compliant with regulations. We enable paperless logistics and production, based on capabilities and requirements of authorities. Electronic Freight Transport Information Regulation (eFTI) and Digital Product Passports (DPP) are two examples of such. By providing templates, especially Small and Medium sized Enterprises (SMEs) are able to digitize business with all customers and these customers, including larger Logistics Service Providers, are able to do the same.</p>
            </div>
          </div>
        </section>
      )}

      {page === "service" && (
        <section className="content-section">
          <h2>Our Service</h2>
          <p>We provide data-sharing solutions for logistics...</p>
        </section>
      )}

      {page === "demo" && (
        <section className="profile-builder-section">
          {isAuthenticated && <Profile />}
          <input
            type="text"
            className="profile-name-input"
            placeholder="Enter profile name..."
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
          <div className="clickable-container">
            <div className="available-fields">
              <h3>Available Fields</h3>
              <div className="field-buttons">
                {availableFields.map((concept, index) => (
                  <ClickableItem key={index} name={concept.label} addToProfile={() => addToProfile(concept)} />
                ))}
              </div>
            </div>
            <ProfileArea fields={fields} removeItem={removeItem} />
          </div>
          <button className="save-button" onClick={saveProfile}>Save Profile</button>
          {downloadLink && <a href={downloadLink} download={downloadFilename} className="download-button">Download Profile (.ttl)</a>}
          {jsonPreview && (
            <div className="json-preview-box">
              <h3>JSON Preview</h3>
              <pre>{JSON.stringify(jsonPreview, null, 2)}</pre>
            </div>
          )}
        </section>
      )}

      {page === "home" && (
        <section className="landing-section">
          <h2 className="landing-title">Welcome to the Interoperability Agent</h2>
          <p>Navigate to the "Demo" section to start building your profile.</p>
        </section>
      )}
    </div>
  );
};

export default App;