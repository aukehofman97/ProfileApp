import React, { useState, useEffect } from 'react';
import { Particles } from "@tsparticles/react";
import * as rdf from 'rdflib';
import './App.css';

// Paths to the TTL files
const DIGITALTWIN_TTL = process.env.PUBLIC_URL + "/data/DigitalTwin.ttl";
const EVENT_TTL = process.env.PUBLIC_URL + "/data/Event.ttl";

const ClickableItem = ({ name, addToProfile }) => {
  return (
    <button className="clickable-button" onClick={() => addToProfile(name)}>
      {name}
    </button>
  );
};

const ProfileArea = ({ fields, removeItem }) => {
  return (
    <div className="profile-box">
      <h3 className="profile-title">Profile</h3>
      {fields.length === 0 ? (
        <p className="drop-placeholder">Click fields to add them...</p>
      ) : (
        <div className="profile-field-container">
          {fields.map((field, index) => (
            <div key={index} className="profile-field">
              {field}
              <button className="delete-btn" onClick={() => removeItem(field)}>✖</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [fields, setFields] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [profileName, setProfileName] = useState("");
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState(
    JSON.parse(localStorage.getItem("profiles")) || []
  );

  useEffect(() => {
    const loadTTLFiles = async () => {
      try {
        const digitalTwinData = await fetch(DIGITALTWIN_TTL).then(res => res.text());
        const eventData = await fetch(EVENT_TTL).then(res => res.text());

        const classes = extractOwlClasses(digitalTwinData).concat(extractOwlClasses(eventData));

        setAvailableFields(classes);
      } catch (error) {
        console.error("Error loading TTL files:", error);
      }
    };

    loadTTLFiles();
  }, []);

  const extractOwlClasses = (ttlData) => {
    const store = rdf.graph();
    rdf.parse(ttlData, store, "http://example.com#", "text/turtle");

    const owlClass = rdf.sym("http://www.w3.org/2002/07/owl#Class");
    return store
        .statementsMatching(null, rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), owlClass)
        .map(stmt => stmt.subject.value.split("#").pop()); // Extract class names
};

  const handleStartClick = () => {
    setShowProfileBuilder(true);
  };

  const addToProfile = (field) => {
    if (!fields.includes(field)) {
      setFields([...fields, field]);
    }
  };

  const removeItem = (field) => {
    setFields(fields.filter((f) => f !== field));
  };

  const saveProfile = () => {
    if (profileName.trim() === "") {
      alert("Please enter a profile name before saving.");
      return;
    }

    const newProfile = { name: profileName, fields };
    const updatedProfiles = [...savedProfiles, newProfile];

    setSavedProfiles(updatedProfiles);
    localStorage.setItem("profiles", JSON.stringify(updatedProfiles));

    alert("Profile saved successfully!");
    setFields([]);
    setProfileName("");
  };

  return (
    <>
      <Particles
        id="particles-js"
        options={{
          background: { color: "#0D1117" },
          particles: {
            number: { value: 80 },
            color: { value: "#64B5F6" },
            shape: { type: "circle" },
            opacity: { value: 0.7 },
            size: { value: 2 },
            move: { enable: true, speed: 1 },
            links: { enable: true, distance: 130, color: "#64B5F6", opacity: 0.6 },
          },
        }}
      />

      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">Interoperability Agent</h1>
        </header>

        <main>
          {!showProfileBuilder ? (
            <section className="landing-section">
              <h2 className="landing-title">Create Your Profile Now</h2>
              <button className="start-button" onClick={handleStartClick}>
                Start
              </button>
            </section>
          ) : (
            <section className="profile-builder-section">
              <div className="profile-name-container">
                <input
                  type="text"
                  className="profile-name-input"
                  placeholder="Enter profile name..."
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </div>

              <div className="clickable-container">
                <div className="available-fields">
                  <h3>Available Fields</h3>
                  <div className="field-buttons">
                    {availableFields.map((concept, index) => (
                      <ClickableItem key={index} name={concept} addToProfile={addToProfile} />
                    ))}
                  </div>
                </div>
                <ProfileArea fields={fields} removeItem={removeItem} />
              </div>

              <button className="save-button" onClick={saveProfile}>Save Profile</button>
            </section>
          )}
        </main>
      </div>
    </>
  );
};

export default App;