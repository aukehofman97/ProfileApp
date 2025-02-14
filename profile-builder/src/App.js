import React, { useState, useEffect } from 'react';
import { Particles } from "@tsparticles/react";
import * as rdf from 'rdflib';
import './App.css';

// Paths to the TTL files
const DIGITALTWIN_TTL = process.env.PUBLIC_URL + "/data/DigitalTwin.ttl";
const EVENT_TTL = process.env.PUBLIC_URL + "/data/Event.ttl";

const ClickableItem = ({ name, addToProfile }) => (
  <button className="clickable-button spaced-button" onClick={() => addToProfile(name)}>
    {name}
  </button>
);

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
  const [fields, setFields] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [classHierarchy, setClassHierarchy] = useState({});
  const [profileName, setProfileName] = useState("");
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [jsonPreview, setJsonPreview] = useState(null);

  useEffect(() => {
    const loadTTLFiles = async () => {
      try {
        const digitalTwinData = await fetch(DIGITALTWIN_TTL).then(res => res.text());
        const eventData = await fetch(EVENT_TTL).then(res => res.text());

        const { classes, hierarchy } = extractClassesAndHierarchy(digitalTwinData + eventData);

        setAvailableFields(classes);
        setClassHierarchy(hierarchy);
      } catch (error) {
        console.error("❌ Error loading TTL files:", error);
      }
    };

    loadTTLFiles();
  }, []);

  const extractClassesAndHierarchy = (ttlData) => {
    const store = rdf.graph();
    rdf.parse(ttlData, store, "http://example.com#", "text/turtle");

    const owl = rdf.Namespace("http://www.w3.org/2002/07/owl#");
    const rdfs = rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");

    let classes = [];
    let hierarchy = {};

    store.statementsMatching(null, rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), owl("Class"))
      .forEach(stmt => {
        const classURI = stmt.subject.value;
        const label = classURI.split("#").pop() || classURI.split("/").pop();
        classes.push({ uri: classURI, label });

        hierarchy[classURI] = { label, subclasses: [] };
      });

    store.statementsMatching(null, rdfs("subClassOf"), null)
      .forEach(stmt => {
        const subclassURI = stmt.subject.value;
        const parentURI = stmt.object.value;

        if (!hierarchy[parentURI]) {
          hierarchy[parentURI] = { label: parentURI.split("#").pop() || parentURI.split("/").pop(), subclasses: [] };
        }
        if (!hierarchy[subclassURI]) {
          hierarchy[subclassURI] = { label: subclassURI.split("#").pop() || subclassURI.split("/").pop(), subclasses: [] };
        }

        hierarchy[parentURI].subclasses.push(subclassURI);
      });

    return { classes, hierarchy };
  };

  const handleStartClick = () => {
    setShowProfileBuilder(true);
  };

  const addToProfile = (field) => {
    if (!fields.find(f => f.uri === field.uri)) {
      setFields([...fields, field]);
    }
  };

  const removeItem = (field) => {
    setFields(fields.filter(f => f.uri !== field.uri));
  };

  const generateSubsetTTL = (selectedClasses, ttlData) => {
    const store = rdf.graph();
    rdf.parse(ttlData, store, "http://example.com#", "text/turtle");

    let ttlString = "";
    let jsonOutput = {};

    let processedClasses = new Set();

    selectedClasses.forEach((classObj) => {
      const classURI = classObj.uri;

      if (!processedClasses.has(classURI)) {
        processedClasses.add(classURI);
        ttlString += `<${classURI}> a owl:Class .\n`;
        jsonOutput[classObj.label] = { type: "Class", properties: {} };
      }

      const traverseSubclasses = (parentURI) => {
        if (classHierarchy[parentURI]) {
          classHierarchy[parentURI].subclasses.forEach(subURI => {
            if (!processedClasses.has(subURI)) {
              processedClasses.add(subURI);
              ttlString += `<${subURI}> a owl:Class ;\n    rdfs:subClassOf <${parentURI}> .\n`;
              jsonOutput[classHierarchy[subURI].label] = {
                type: "Class",
                parent: classHierarchy[parentURI].label,
                properties: {},
              };
              traverseSubclasses(subURI);
            }
          });
        }
      };

      traverseSubclasses(classURI);

      const relatedProperties = store.statementsMatching(
        null,
        rdf.sym("http://www.w3.org/2000/01/rdf-schema#domain"),
        rdf.sym(classURI)
      );
      relatedProperties.forEach(propStmt => {
        const propName = propStmt.subject.value.split("#").pop() || propStmt.subject.value.split("/").pop();
        jsonOutput[classObj.label].properties[propName] = "string";
      });
    });

    setJsonPreview(jsonOutput);
    return ttlString;
  };

  const saveProfile = async () => {
    if (profileName.trim() === "") {
      alert("Please enter a profile name before saving.");
      return;
    }

    try {
      const digitalTwinData = await fetch(DIGITALTWIN_TTL).then(res => res.text());
      const eventData = await fetch(EVENT_TTL).then(res => res.text());

      const profileTTL = generateSubsetTTL(fields, digitalTwinData + eventData);

      const blob = new Blob([profileTTL], { type: "text/turtle" });
      const url = URL.createObjectURL(blob);

      setDownloadLink(url);
      setDownloadFilename(`${profileName.replace(/\s+/g, "_")}.ttl`);
    } catch (error) {
      console.error("❌ Error saving profile:", error);
    }
  };

  return (
    <>
      <Particles id="particles-js" />
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">Interoperability Agent</h1>
        </header>

        {!showProfileBuilder ? (
          <section className="landing-section">
            <h2 className="landing-title">Create Your Profile Now</h2>
            <button className="start-button" onClick={handleStartClick}>
              Start
            </button>
          </section>
        ) : (
          <section className="profile-builder-section">
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
      </div>
    </>
  );
};

export default App;