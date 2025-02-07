import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import axios from 'axios';
import './App.css';

const concepts = {
  Container: ["equipmentTypeCode", "containerNumber", "containerSize", "containerType"],
  Goods: ["goodsTypeCode", "typeOfCargo", "natureOfCargo", "PackageTypeNumericCode"],
  Vessel: ["vesselName", "transportMeansMode", "vesselType"],
  Truck: ["hasVIN", "truckLicensePlate", "transportMeansMode"],
  Wagon: ["wagonBrakeType", "wagonMaximumSpeed", "wagonNrAxel"],
};

const DraggableItem = ({ name, type, concept, toggleExpand, expanded }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "FIELD",
    item: { name, type, concept },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} className={`draggable-item ${type === "supertype" ? "supertype" : "subtype"}`} onClick={() => type === "supertype" && toggleExpand(concept)}>
      {name}
      {type === "supertype" && (
        <span className="expand-icon">{expanded ? "🔽" : "▶"}</span>
      )}
    </div>
  );
};

const DropArea = ({ fields, setFields }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "FIELD",
    drop: (item) => {
      setFields((prev) => {
        const updatedFields = { ...prev };
        if (item.type === "supertype") {
          updatedFields[item.name] = concepts[item.name].map((prop) => ({
            name: prop,
            type: "subtype",
          }));
        } else {
          if (!updatedFields[item.concept]) {
            updatedFields[item.concept] = [];
          }
          updatedFields[item.concept].push({ name: item.name, type: "subtype" });
        }
        return updatedFields;
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop} className="profile-box">
      <h3 className="profile-title">Profile</h3>
      {Object.keys(fields).length === 0 ? (
        <p className="drop-placeholder">Drag fields here...</p>
      ) : (
        Object.keys(fields).map((concept) => (
          <div key={concept} className="concept-group">
            <h4 className="concept-title">{concept}</h4>
            <div className="field-list">
              {fields[concept].map((field, index) => (
                <div key={index} className="profile-field">
                  {field.name}
                  <button className="delete-btn" onClick={() => removeItem(concept, field.name)}>
                    ➖
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const App = () => {
  const [fields, setFields] = useState({});
  const [expandedConcepts, setExpandedConcepts] = useState({});
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);

  const toggleExpand = (concept) => {
    setExpandedConcepts((prev) => ({
      ...prev,
      [concept]: !prev[concept],
    }));
  };

  const handleStartClick = () => {
    setShowProfileBuilder(true);
    setTimeout(() => {
      const element = document.getElementById('profile-builder');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Particles 
        id="particles-js"
        init={loadFull}
        options={{
          background: { color: "#0D1117" },
          particles: {
            number: { value: 60 },
            color: { value: "#64B5F6" },
            shape: { type: "circle" },
            opacity: { value: 0.8 },
            size: { value: 3 },
            move: { enable: true, speed: 1.5 },
            links: {
              enable: true,
              distance: 120,
              color: "#64B5F6",
              opacity: 0.5,
            },
          },
        }}
      />
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">Interoperability Agent</h1>
        </header>
        <main>
          <section className="landing-section">
            <h2 className="landing-title">Create Your Profile Now</h2>
            <button className="start-button" onClick={handleStartClick}>
              Start
            </button>
          </section>
          {showProfileBuilder && (
            <section id="profile-builder" className="profile-builder-section">
              <div className="drag-drop-container">
                <div className="available-fields">
                  <h3>Available Fields</h3>
                  {Object.keys(concepts).map((concept) => (
                    <div key={concept}>
                      <DraggableItem
                        name={concept}
                        type="supertype"
                        concept={concept}
                        toggleExpand={toggleExpand}
                        expanded={expandedConcepts[concept]}
                      />
                      {expandedConcepts[concept] &&
                        concepts[concept].map((prop, idx) => (
                          <DraggableItem key={idx} name={prop} type="subtype" concept={concept} />
                        ))}
                    </div>
                  ))}
                </div>
                <DropArea fields={fields} setFields={setFields} />
              </div>
              <button className="save-button">
                Save Profile
              </button>
            </section>
          )}
        </main>
      </div>
    </DndProvider>
  );
};

export default App;
