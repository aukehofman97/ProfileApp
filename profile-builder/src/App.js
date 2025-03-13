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
          <span onClick={() => setPage("vision")}>Vision</span>
          <span onClick={() => setPage("service")}>Service & Solution</span>
          <span onClick={() => setPage("demo")}>Demo</span>
          {isAuthenticated ? <LogoutButton /> : <LoginButton />}
        </nav>
      </header>

      {page === "about" && (
        <section className="content-section">
          <div className="about-main">
            <h2>About</h2>
            <p>Interoperability Agent enables organizations to share data by providing them with the necessary capabilities. We provide services, downloadable software supporting (inter)national standards, and online tooling to configurate this software. Our core focus is to enable data transformation with Large Language Models (LLMs) and common semantics.</p>
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

      {page === "vision" && (
        <section className="content-section">
          {/* Network Effect Block */}
          <div className="vision-block">
            <div className="vision-main">
              <h2>Network effect</h2>
              <p>In the rapidly evolving logistics industry, network effects play a pivotal role in enhancing operational efficiency and fostering collaboration. Network effects occur when the value of a service or product increases as more people use it. This phenomenon is particularly relevant for customers, logistics service providers, and authorities as they strive to create seamless and efficient logistics networks.</p>
            </div>
            <div className="vision-subsections-container">
              <div className="vision-subsection">
                <h3>Customers</h3>
                <p>Network effects lead to improved service quality and cost reduction. As more customers join a logistics network, service providers can optimize routes, consolidate shipments, and offer more competitive pricing. Additionally, a larger customer base allows for a more comprehensive range of services, catering to diverse needs and preferences.</p>
              </div>
              <div className="vision-subsection">
                <h3>Logistics Service Providers</h3>
                <p>Logistics service providers benefit from network effects through increased operational efficiency and market reach. As the network grows, providers can leverage economies of scale, reduce idle times, and enhance asset utilization. Furthermore, collaboration with other providers within the network can lead to shared resources, knowledge exchange, and innovative solutions.</p>
              </div>
              <div className="vision-subsection">
                <h3>Authorities</h3>
                <p>Authorities, such as regulatory bodies and government agencies, play a crucial role in facilitating network effects. By promoting standardization, ensuring compliance, and providing infrastructure support, authorities can help create a conducive environment for network growth. Additionally, data sharing between authorities and logistics networks can enhance transparency, security, and overall efficiency.</p>
              </div>
            </div>
          </div>

          {/* Benefits Block */}
          <div className="vision-block">
            <div className="vision-main">
              <h2>Benefits</h2>
              <p>Organizations benefit from digitization, primarily by reduction of administrative costs. Business process optimization and innovation is obtained, contributing to sustainability goals by carbon footprint – and waste reduction.</p>
            </div>
            <div className="vision-subsections-container">
              <div className="vision-subsection">
                <h3>Cost reduction</h3>
                <p>It is about better quality data. Retyping data and human interpretation of data is avoided, since data is digitized and machine-processable with a common semantics. It is also about reduction of error handling. Each organization can make its IT systems suitable for this common data.</p>
              </div>
              <div className="vision-subsection">
                <h3>Business process optimization</h3>
                <p>Organizations become agile and resilient with supply chain visibility and advanced knowledge of disruptions. Enhanced decision-making contributes to predictable and sustainable goods flows and improves customer services.</p>
              </div>
              <div className="vision-subsection">
                <h3>Business process innovation</h3>
                <p>Artificial Intelligences will impact supply and logistics, especially decision-making. Innovative solution providers will offer interoperable AI agents (as a service). Enterprises can dynamically share resources, automatic routing of packages in logistics networks will be possible, monitoring and control by supervising bodies will be improved, etc. The Physical Internet is created.</p>
              </div>
            </div>
          </div>

          {/* Open, scalable communities Block */}
          <div className="vision-block">
            <div className="vision-main">
              <h2>Open, scalable communities</h2>
              <p>Communities are a way to organize the implementation of data sharing. It must start somewhere to create a network effect! It is about an open network without central governance! Everybody can join, thus creating a snowball effect. Our focus is on finding opinion leaders and initial applications to widening.</p>
            </div>
            <div className="vision-subsections-container">
              <div className="vision-subsection">
                <h3>Opinion leaders</h3>
                <p>These are persons and organizations in your community that influence decisions of others. They are key to the success of forming an open community. They are the ones that spread the message. Opinion leaders must strive for an open, neutral data sharing solution.</p>
              </div>
              <div className="vision-subsection">
                <h3>Killer application</h3>
                <p>Each organization will have its own killer application. To form a community, they must have one in common. A killer application addresses benefits that can be achieved easy at a short notice. It is about data sharing that is not yet digitized! It is about low hanging fruit! Focus on cost reduction and business process innovation. Supply chain visibility is an example of such an initial application. Another example is paperless supply and logistics requiring full digitization of data sharing: ordering and visibility. A killer application can also support a particular type of chain like the cold chain.</p>
              </div>
              <div className="vision-subsection">
                <h3>Widening</h3>
                <p>Initially, a select group of organizations will commence data sharing with a commitment to expanding its application with others. Another dimension of this expansion involves exploring innovative applications for business advancement. Both aspects of this expansion are achievable with the proposed solutions and services.</p>
              </div>
              <div className="vision-subsection">
                <h3>Trust</h3>
                <p>Widening requires trust. It means authentication of one's identity for certainty to share data with another trusted stakeholder. In the short term, tokens issued by Trusted Service Providers will be applied; in the longer term these will be replaced with Verifiable Credentials (VCs), also issued by Trusted Service Providers. The difference between tokens and VCs is there management: tokens are issued and applied with one (or a community) of data sharing partners for a duration (or one time use); you manage a VC yourself in your wallet and use it in your daily data sharing with all others.</p>
              </div>
              <div className="vision-subsection">
                <h3>Data sharing rules</h3>
                <p>Applying agreed rules, regulation, and acts is also part of trust. These are the core to create Trusted Service Providers. Available solutions developed by the EC will be applied as much as possible (see for instance dssc.eu).</p>
              </div>
            </div>
          </div>

          {/* Three ways for data sharing Block */}
          <div className="vision-block">
            <div className="vision-main">
              <h2>Three ways for data sharing</h2>
              <p>The core of our solution is Interoperability with Artificial Intelligence – IAI – embedded in other solutions and services for implementing data sharing. Each organization makes its own choice as to this implementation.</p>
            </div>
            <div className="vision-subsections-container">
              <div className="vision-subsection">
                <h3>Gateway or proxy</h3>
                <p>Gateway software is critical for ensuring seamless connectivity between different systems and platforms within the organizational network. By installing this software, an organization has a central hub, facilitating data exchange, communication, and integration of various applications.</p>
              </div>
              <div className="vision-subsection">
                <h3>Platform</h3>
                <p>An organization integrates with a platform and uses the network effect of that platform to share data to rapidly digitize business collaboration. Each platform has its own services to their users and implements data sharing with a common format. Federation of platforms avoids membership of multiple platforms.</p>
              </div>
              <div className="vision-subsection">
                <h3>Cloud service provision</h3>
                <p>A cloud environment supports data sharing with other users of the same cloud environment and is capable to share data with cloud environments of other providers.</p>
              </div>
            </div>
          </div>

          {/* Apps on smart devices Block */}
          <div className="vision-block">
            <div className="vision-main">
              <h2>Apps on smart devices</h2>
              <p>Mobile and web applications play a crucial role in streamlining logistics operations and enhancing user experience. These apps provide real-time updates, tracking, and communication tools for customers, service providers, and authorities. They provide full functionality to SMEs, Small and Medium sized Enterprises, and function as a (remote) portal to many large organizations (customers, logistics service providers, authorities).</p>
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
          <h2 className="landing-title">IAI - Interoperability with Artificial Intelligence</h2>
          <p>Navigate to the "Demo" section to start building your profile.</p>
        </section>
      )}
      
      <footer className="footer">
        <p><strong>Interoperability Agent</strong></p>
        <p>Wout Hofman</p>
        <p>T: 06 – 22 499 890</p>
        <p>KvK 95811583</p>
        <p>E: wattejelle@icloud.com</p>
        <p>VAT NL 001181504B65</p>
      </footer>
    </div>
  );
};

export default App;