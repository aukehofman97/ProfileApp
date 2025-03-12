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
          <div className="service-main">
            <p>Our services and solutions focus on creating and supporting the initial setup of communities and provide them with open data sharing solutions. To its core is data transformation by Large Language Models with the semantic model developed in the CEF (Connecting Europe Facilities) funded FEDeRATED Action (federatedplatforms.eu).</p>
          </div>

          {/* Solutions Block */}
          <div className="service-block">
            <h2>Solutions</h2>
            <div className="service-grid">
              <div className="service-card">
                <h3>Semantics and standards</h3>
                <p>There is a variety of open and defacto standards. These are harmonized by their semantics. The semantics itself is available in an open standard. When available, a standardized semantic model will replace our current solution that is based on the FEDeRATED semantic model. Our model enables transformation between any hierarchical data set, either an internal format or a (community) standard.</p>
              </div>
              <div className="service-card">
                <h3>Multimodal Transport Service</h3>
                <p>Semantics specifies a set of interaction like bookings, orders, and various visibility events like arrival – and departure events. It is called the Multimodal Transport Service (MTS) and supports data sharing for all modalities and cargo types. This service also specifies all required (electronic) document data sets. Compare it with the United Nations Lay-out key developed years ago for transport documents.</p>
              </div>
              <div className="service-card">
                <h3>Large Language Models</h3>
                <p>Our semantic model and its services like the Multimodal Transport Service is the lingua franca for a Large Language Model. Such a model can transform any data set and standard into another via this intermediate language.</p>
              </div>
              <div className="service-card">
                <h3>Gateway</h3>
                <p>A gateway or proxy can be downloaded and installed. It is a dockerized solution that can be installed on any server, either in your own IT - or in a cloud environment. After installation, there is an openAPI (open Application Programming Interface) configured to your data sharing capabilities for integration with your own IT system(s). Any firewall settings must be configured to enable data sharing with others. A gateway will interface with any selected Trust Service Provider in a community, either using tokens or interfacing with wallet software for VCs.</p>
              </div>
              <div className="service-card">
                <h3>Configuration</h3>
                <p>Each organization has different capabilities and data requirements. These capabilities and requirements select and configure a Data Sharing Service like the MTS to create a data structure of the openAPI provided by a Gateway or implemented by a platform. The selection of a Data Sharing Service is the basis for configuring a collaboration agreement for data sharing with another organization. This provides large scale data sharing. We provide an online tool for this configuration and management of collaboration agreements.</p>
              </div>
            </div>
          </div>

          {/* Services Block */}
          <div className="service-block">
            <h2>Services</h2>
            <div className="service-subsections-container">
              <div className="service-subsection">
                <h3>Community support</h3>
                <p>Identifying opinion leaders is the start of an open community. We assist an opinion leader in setting up a community with its customers, service providers, competitors, and authorities. We support such a community in formulating their business case, its supporting use case, and drafting an implementation architecture. We support individual organizations in integrating the solution with their internal IT systems. When required, app development is supported.</p>
              </div>
              <div className="service-subsection">
                <h3>Use case specification</h3>
                <p>It is about drafting all interactions between stakeholders in a use case and matching these with an available Data Sharing Service. It is also about identifying missing Data Sharing Services, elements of the semantic model, and mapping to implemented (open or defacto) standards.</p>
              </div>
              <div className="service-subsection">
                <h3>Service Management and Innovation</h3>
                <p>The semantic model and its Data Sharing Services grow evolutionary. Initially, the model supports at least Multimodal transport Visibility as an example of a killer application. The model is extended with evolving requirements of use cases. These extensions can be open or a community may want them available to its members to gain a competitive advantage.</p>
              </div>
            </div>
          </div>
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