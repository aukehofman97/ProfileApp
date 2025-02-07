import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";

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
    <div
      ref={drag}
      onClick={() => type === "supertype" && toggleExpand(concept)}
      style={{
        padding: "6px 10px",
        margin: "4px",
        backgroundColor: type === "supertype" ? "#1565C0" : "#1E88E5",
        color: "white",
        borderRadius: "6px",
        textAlign: "left",
        fontWeight: "bold",
        cursor: "grab",
        opacity: isDragging ? 0.6 : 1,
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "180px",
      }}
    >
      {name}
      {type === "supertype" && (
        <span style={{ fontSize: "14px", cursor: "pointer" }}>
          {expanded ? "🔽" : "▶"}
        </span>
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

  const removeItem = (concept, itemName) => {
    setFields((prev) => {
      const updatedFields = { ...prev };
      updatedFields[concept] = updatedFields[concept].filter((item) => item.name !== itemName);

      if (updatedFields[concept].length === 0) {
        delete updatedFields[concept];
      }
      return updatedFields;
    });
  };

  return (
    <div
      ref={drop}
      style={{
        flex: 1,
        padding: "15px",
        minHeight: "200px",
        border: "2px dashed #BBDEFB",
        backgroundColor: isOver ? "#0D47A1" : "#1A237E",
        color: "white",
        borderRadius: "8px",
        textAlign: "left",
        fontSize: "12px",
        boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      {Object.keys(fields).length === 0 ? (
        <p style={{ opacity: 0.6, textAlign: "center" }}>Drag fields here...</p>
      ) : (
        Object.keys(fields).map((concept) => (
          <div key={concept} style={{ marginBottom: "8px" }}>
            <h4 style={{ color: "#64B5F6", marginBottom: "4px", fontSize: "14px" }}>{concept}</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {fields[concept].map((field, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    background: "#64B5F6",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    minWidth: "120px",
                  }}
                >
                  {field.name}
                  <button
                    onClick={() => removeItem(concept, field.name)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
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

  const toggleExpand = (concept) => {
    setExpandedConcepts((prev) => ({
      ...prev,
      [concept]: !prev[concept],
    }));
  };

  const handleSubmit = async () => {
    const jsonProfile = { fields };
    console.log("Generated JSON:", jsonProfile);

    try {
      await axios.post("http://127.0.0.1:8000/api/profile", jsonProfile);
      alert("Profile saved!");
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{
          backgroundColor: "#0D1117",
          minHeight: "100vh",
          padding: "20px",
          color: "white",
          fontFamily: "'Arial', sans-serif",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#64B5F6" }}>Profile Builder</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          <div
            style={{
              backgroundColor: "#1A237E",
              padding: "20px",
              borderRadius: "8px",
              width: "260px",
              textAlign: "center",
              boxShadow: "3px 3px 6px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3>Available Fields</h3>
            {Object.keys(concepts).map((concept) => (
              <div key={concept} style={{ marginBottom: "5px" }}>
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
      </div>
    </DndProvider>
  );
};

export default App;